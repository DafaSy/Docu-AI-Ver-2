export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_MULTIPART_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024;

type FileKind = "pdf" | "txt" | "csv";

export type UploadValidationResult =
  | { ok: true; kind: FileKind; safeName: string }
  | { ok: false; status: number; code: string; message: string };

const allowedMimeTypes: Record<FileKind, Set<string>> = {
  pdf: new Set(["application/pdf", "application/octet-stream"]),
  txt: new Set(["text/plain", "application/octet-stream"]),
  csv: new Set([
    "text/csv",
    "application/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/octet-stream",
  ]),
};

const dangerousInnerExtensions = new Set([
  "bat", "cmd", "com", "cpl", "dll", "exe", "hta", "html", "htm", "jar",
  "js", "jse", "lnk", "msi", "php", "ps1", "py", "scr", "sh", "svg",
  "vbs", "vbe", "wsf",
]);

const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const eicarMarker = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
const dangerousPdfFeatures = [
  /\/JavaScript\b/i,
  /\/JS\b/i,
  /\/Launch\b/i,
  /\/EmbeddedFile\b/i,
  /\/RichMedia\b/i,
  /\/OpenAction\b/i,
  /\/XFA\b/i,
];

export async function validateUploadFile(file: File): Promise<UploadValidationResult> {
  const nameResult = validateFileName(file.name);
  if (!nameResult.ok) return nameResult;

  if (file.size === 0) return reject(400, "empty_file", "The uploaded file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    return reject(413, "file_too_large", "The file exceeds the 25 MB upload limit.");
  }

  const extension = nameResult.safeName.split(".").pop()!.toLowerCase() as FileKind;
  const suppliedMime = file.type.trim().toLowerCase();
  if (suppliedMime && !allowedMimeTypes[extension].has(suppliedMime)) {
    return reject(
      415,
      "mime_mismatch",
      `The declared MIME type (${suppliedMime}) does not match a .${extension} file.`,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const latin1 = new TextDecoder("latin1").decode(bytes);
  if (latin1.includes(eicarMarker)) {
    return reject(422, "malware_test_signature", "The file matches a known antivirus test signature.");
  }

  if (extension === "pdf") {
    const pdfResult = validatePdf(bytes, latin1);
    if (!pdfResult.ok) return pdfResult;
  } else {
    const textResult = validateText(bytes, extension);
    if (!textResult.ok) return textResult;
  }

  return { ok: true, kind: extension, safeName: nameResult.safeName };
}

function validateFileName(name: string): UploadValidationResult {
  const normalized = name.normalize("NFKC").trim();
  if (!normalized || normalized.length > 180) {
    return reject(400, "unsafe_filename", "The filename must contain between 1 and 180 characters.");
  }
  if (normalized.startsWith(".") || normalized.endsWith(".") || normalized.endsWith(" ")) {
    return reject(400, "unsafe_filename", "Hidden files and filenames ending in a dot or space are not allowed.");
  }
  if (/[\\/\u0000-\u001f\u007f]/.test(normalized) || normalized.includes("..") || /%00/i.test(normalized)) {
    return reject(400, "unsafe_filename", "The filename contains an unsafe path or control sequence.");
  }

  const parts = normalized.toLowerCase().split(".");
  if (parts.length < 2) return reject(415, "missing_extension", "The file must have a .pdf, .txt, or .csv extension.");
  const extension = parts.at(-1)!;
  if (!(["pdf", "txt", "csv"] as string[]).includes(extension)) {
    return reject(415, "extension_not_allowed", "Only PDF, TXT, and CSV files are allowed.");
  }
  if (parts.slice(1, -1).some((part) => dangerousInnerExtensions.has(part))) {
    return reject(400, "double_extension", "The filename contains a dangerous double extension.");
  }

  const baseName = parts[0];
  if (reservedWindowsNames.test(baseName)) {
    return reject(400, "reserved_filename", "The filename uses a reserved system name.");
  }

  return { ok: true, kind: extension as FileKind, safeName: normalized };
}

function validatePdf(bytes: Uint8Array, latin1: string): UploadValidationResult {
  const header = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(1024, bytes.length)));
  if (!/%PDF-1\.[0-9]/.test(header)) {
    return reject(415, "invalid_pdf_signature", "The file extension is PDF, but its PDF signature is missing or invalid.");
  }

  const tail = new TextDecoder("latin1").decode(bytes.slice(Math.max(0, bytes.length - 4096)));
  if (!tail.includes("%%EOF")) {
    return reject(422, "corrupt_pdf", "The PDF appears incomplete or corrupt because its end marker is missing.");
  }
  if (/\/Encrypt\b/i.test(latin1)) {
    return reject(422, "encrypted_pdf", "Password-protected or encrypted PDFs are not supported.");
  }
  if (dangerousPdfFeatures.some((pattern) => pattern.test(latin1))) {
    return reject(422, "active_pdf_content", "PDFs containing scripts, embedded files, launch actions, or active forms are not allowed.");
  }

  return { ok: true, kind: "pdf", safeName: "validated.pdf" };
}

function validateText(bytes: Uint8Array, kind: "txt" | "csv"): UploadValidationResult {
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return reject(415, "invalid_text_encoding", "TXT and CSV files must use valid UTF-8 encoding.");
  }

  if (decoded.includes("\u0000")) {
    return reject(415, "binary_content", "The file contains binary data and cannot be processed as text.");
  }

  let unsafeControls = 0;
  for (const character of decoded) {
    const code = character.charCodeAt(0);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) unsafeControls += 1;
  }
  if (unsafeControls > Math.max(3, decoded.length * 0.001)) {
    return reject(415, "binary_content", "The file contains too many non-text control characters.");
  }

  if (!decoded.trim()) return reject(400, "empty_text", `The ${kind.toUpperCase()} file contains no readable text.`);
  return { ok: true, kind, safeName: `validated.${kind}` };
}

function reject(status: number, code: string, message: string): UploadValidationResult {
  return { ok: false, status, code, message };
}
