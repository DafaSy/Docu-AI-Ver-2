import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.EXPORT_BASE_URL || "http://localhost:5173";
const outputDirectory = process.env.EXPORT_OUTPUT_DIR || "exports";

const publicRoutes = [
  { name: "homepage", path: "/" },
  { name: "about", path: "/about" },
  { name: "pricing", path: "/pricing" },
  { name: "community", path: "/community", captureSupportTab: true },
];

const workspaceRoute = { name: "workspace", path: "/app" };
const adminRoute = { name: "admin-dashboard", path: "/admin" };

const userCredentials = {
  email: process.env.EXPORT_EMAIL || "",
  password: process.env.EXPORT_PASSWORD || "",
};

const adminCredentials = {
  email: process.env.EXPORT_ADMIN_EMAIL || userCredentials.email,
  password: process.env.EXPORT_ADMIN_PASSWORD || userCredentials.password,
};

const devicesToExport = [
  {
    name: "desktop",
    contextOptions: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  },
  {
    name: "mobile",
    contextOptions: {
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    },
  },
];

fs.mkdirSync(outputDirectory, { recursive: true });

function outputName(pageName, deviceName, sectionName = "") {
  const section = sectionName ? `-${sectionName}` : "";
  const device = deviceName === "desktop" ? "" : `-${deviceName}`;
  return path.join(outputDirectory, `${pageName}${section}${device}.png`);
}

async function waitForPage(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(1800);
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      *, *::before, *::after {
        caret-color: transparent !important;
        transition-duration: 0s !important;
      }
      [data-export-section="header"] { position: relative !important; top: auto !important; }
    `,
  });
}

async function assertResponsiveWidth(page, expectedWidth, routeName) {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));

  if (layout.scrollWidth > expectedWidth + 1) {
    throw new Error(
      `${routeName} melebar ke ${layout.scrollWidth}px pada viewport ${layout.viewport}px.`,
    );
  }
}

async function captureSection(page, route, deviceName, sectionName, locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);

  const outputPath = outputName(route.name, deviceName, sectionName);
  await locator.screenshot({ path: outputPath, animations: "disabled" });
  console.log(`  Section: ${outputPath}`);
}

async function captureVisibleSections(page, route, deviceName) {
  const sections = page.locator("[data-export-section]");
  const count = await sections.count();
  const usedNames = new Map();

  for (let index = 0; index < count; index += 1) {
    const locator = sections.nth(index);
    if (!(await locator.isVisible())) continue;

    const rawName = await locator.getAttribute("data-export-section");
    if (!rawName) continue;

    const duplicateIndex = usedNames.get(rawName) || 0;
    usedNames.set(rawName, duplicateIndex + 1);
    const sectionName = duplicateIndex ? `${rawName}-${duplicateIndex + 1}` : rawName;
    await captureSection(page, route, deviceName, sectionName, locator);
  }
}

async function captureRoute(page, route, deviceName, viewportWidth) {
  const url = `${baseUrl}${route.path}`;
  console.log(`Membuka: ${url}`);

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await waitForPage(page);

  const actualPath = new URL(page.url()).pathname;
  if (actualPath !== route.path) {
    throw new Error(
      `${route.name} tidak dapat diekspor karena diarahkan ke ${actualPath}. Periksa akun dan hak aksesnya.`,
    );
  }

  await assertResponsiveWidth(page, viewportWidth, route.name);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  const pageOutput = outputName(route.name, deviceName);
  await page.screenshot({ path: pageOutput, fullPage: false, animations: "disabled" });
  console.log(`Page: ${pageOutput}`);

  await captureVisibleSections(page, route, deviceName);

  if (route.captureSupportTab) {
    const supportButton = page.getByRole("button", { name: /support & feedback/i });
    if (await supportButton.isVisible()) {
      await supportButton.click();
      await page.waitForTimeout(350);
      const support = page.locator('[data-export-section="support-feedback"]');
      if (await support.isVisible()) {
        await captureSection(page, route, deviceName, "support-feedback", support);
      }
    }
  }
}

async function login(page, credentials, adminMode = false) {
  if (!credentials.email || !credentials.password) return false;

  const loginUrl = `${baseUrl}/login${adminMode ? "?mode=admin" : ""}`;
  await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  await page.getByRole("button", { name: adminMode ? /sign in as admin/i : /^sign in$/i }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    await page.waitForTimeout(1000);
    return true;
  } catch {
    const error = await page.locator('[class*="text-danger"]').first().textContent().catch(() => "");
    throw new Error(`Login export gagal${error ? `: ${error.trim()}` : "."}`);
  }
}

async function exportPublicRoutes(browser, device) {
  const context = await browser.newContext(device.contextOptions);
  const page = await context.newPage();
  try {
    for (const route of publicRoutes) {
      await captureRoute(page, route, device.name, device.contextOptions.viewport.width);
    }
  } finally {
    await context.close();
  }
}

async function exportProtectedRoute(browser, device, route, credentials, adminMode) {
  if (!credentials.email || !credentials.password) {
    console.warn(
      `Lewati ${route.name}-${device.name}: credential export belum tersedia.`,
    );
    return;
  }

  const context = await browser.newContext(device.contextOptions);
  const page = await context.newPage();
  try {
    await login(page, credentials, adminMode);
    await captureRoute(page, route, device.name, device.contextOptions.viewport.width);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch();

try {
  for (const device of devicesToExport) {
    console.log(`\n=== ${device.name.toUpperCase()} ===`);
    await exportPublicRoutes(browser, device);
    await exportProtectedRoute(browser, device, workspaceRoute, userCredentials, false);
    await exportProtectedRoute(browser, device, adminRoute, adminCredentials, true);
  }
} catch (error) {
  console.error("Proses export gagal:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}

console.log("\nSemua proses export selesai.");
