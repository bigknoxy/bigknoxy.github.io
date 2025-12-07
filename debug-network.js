import { chromium } from "playwright";

async function debugNetworkRequests() {
  console.log("🔍 Debugging network requests...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests = [];
  const responses = [];

  page.on("request", (request) => {
    requests.push({ url: request.url(), method: request.method() });
  });

  page.on("response", (response) => {
    responses.push({
      url: response.url(),
      status: response.status(),
      contentType: response.headers()["content-type"] || "unknown",
    });

    if (response.status() >= 400) {
      console.log(`❌ ${response.status()}: ${response.url()}`);
    }
  });

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    console.log("\n📋 All requests:");
    requests.forEach((req) => console.log(`  ${req.method} ${req.url}`));

    console.log("\n📋 All responses:");
    responses.forEach((res) => {
      const status =
        res.status >= 400 ? `❌ ${res.status}` : `✅ ${res.status}`;
      console.log(`  ${status}: ${res.url} (${res.contentType})`);
    });

    // Wait a bit more for any lazy-loaded resources
    await page.waitForTimeout(3000);

    console.log("\n🎮 Checking game-specific resources...");

    const gameResources = responses.filter(
      (res) => res.url.includes("/game/") || res.url.includes("/styles/"),
    );

    gameResources.forEach((res) => {
      const status =
        res.status >= 400 ? `❌ ${res.status}` : `✅ ${res.status}`;
      console.log(`  ${status}: ${res.url} (${res.contentType})`);
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

debugNetworkRequests();
