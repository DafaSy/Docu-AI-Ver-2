import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Client-Info, Apikey",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const configuredEmail = Deno.env.get("ADMIN_EMAIL")?.trim().toLowerCase();
  const configuredUserId = Deno.env.get("ADMIN_USER_ID")?.trim();
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase function secrets are incomplete" }, 500);
  }

  if (!configuredEmail && !configuredUserId) {
    return json({ error: "ADMIN_EMAIL or ADMIN_USER_ID is not configured" }, 500);
  }

  if (!authorization) {
    return json({ error: "Missing authorization token" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    return json({ error: "Invalid user session" }, 401);
  }

  const emailMatches = Boolean(
    configuredEmail && user.email?.toLowerCase() === configuredEmail,
  );
  const idMatches = Boolean(configuredUserId && user.id === configuredUserId);

  if (!emailMatches && !idMatches) {
    return json({ error: "This account is not authorized as an admin" }, 403);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: insertError } = await adminClient
    .from("admin_users")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  if (insertError) {
    return json({ error: insertError.message }, 500);
  }

  return json({ admin: true, userId: user.id });
});
