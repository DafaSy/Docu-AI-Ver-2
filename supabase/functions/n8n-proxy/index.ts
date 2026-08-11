import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  MAX_MULTIPART_BYTES,
  validateUploadFile,
} from "./uploadValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, ngrok-skip-browser-warning",
};

const N8N_BASE = Deno.env.get("N8N_BASE_URL") ?? "https://city-payback-aids.ngrok-free.dev";

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!N8N_BASE) {
      return new Response(JSON.stringify({ error: "N8N_BASE_URL is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/n8n-proxy/, "");
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (!authenticatedUserId) {
      return jsonResponse({
        error: "Unauthorized",
        code: "invalid_session",
        message: "A valid authenticated user session is required.",
      }, 401);
    }

    let targetPath = path;
    if (!targetPath.startsWith("/webhook")) {
      return new Response(
        JSON.stringify({ error: "Only /webhook/* paths are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const targetUrl = `${N8N_BASE}${targetPath}`;

    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "true",
    };

    let body: BodyInit | null = null;

    if (req.method === "POST" || req.method === "PUT") {
      const contentType = req.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        headers["Content-Type"] = "application/json";
        const payload = await req.json();
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          return jsonResponse({ error: "Invalid JSON payload" }, 400);
        }
        body = JSON.stringify({
          ...(payload as Record<string, unknown>),
          userID: authenticatedUserId,
        });
      } else if (contentType.includes("multipart/form-data")) {
        const declaredLength = Number(req.headers.get("Content-Length") || 0);
        if (declaredLength > MAX_MULTIPART_BYTES) {
          return jsonResponse({
            error: "Upload rejected",
            code: "request_too_large",
            message: "The multipart upload exceeds the allowed request size.",
          }, 413);
        }

        const formData = await req.formData();
        const dataFiles = formData.getAll("data").filter((value): value is File => value instanceof File);
        const unexpectedFiles = [...formData.entries()].filter(([key, value]) => value instanceof File && key !== "data");

        if (dataFiles.length !== 1 || unexpectedFiles.length > 0) {
          return jsonResponse({
            error: "Upload rejected",
            code: "invalid_file_fields",
            message: "Send exactly one file using the multipart field named data.",
          }, 400);
        }

        const file = dataFiles[0];
        const validation = await validateUploadFile(file);
        if (!validation.ok) {
          return jsonResponse({
            error: "Upload rejected",
            code: validation.code,
            message: validation.message,
          }, validation.status);
        }

        const metadataSize = formData.get("size");
        if (typeof metadataSize === "string" && Number(metadataSize) !== file.size) {
          return jsonResponse({
            error: "Upload rejected",
            code: "size_metadata_mismatch",
            message: "The declared file size does not match the uploaded file.",
          }, 400);
        }

        formData.set("filename", validation.safeName);
        const canonicalMime = validation.kind === "pdf"
          ? "application/pdf"
          : validation.kind === "csv"
          ? "text/csv"
          : "text/plain";
        formData.set("contentType", file.type || canonicalMime);
        formData.set("size", String(file.size));
        formData.set("userID", authenticatedUserId);
        body = formData;
      } else {
        body = await req.text();
        headers["Content-Type"] = contentType;
      }
    }

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const respBody = await upstreamRes.text();

    const respHeaders: Record<string, string> = {
      ...corsHeaders,
    };

    const upstreamContentType = upstreamRes.headers.get("Content-Type");
    if (upstreamContentType) {
      respHeaders["Content-Type"] = upstreamContentType;
    } else {
      respHeaders["Content-Type"] = "text/plain";
    }

    return new Response(respBody, {
      status: upstreamRes.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Proxy error",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function getAuthenticatedUserId(req: Request): string | null {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { sub?: unknown; exp?: unknown };
    if (typeof payload.sub !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.sub)) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
