// PDF generation via Puppeteer (headless Chrome).
//
// A Chrome launch costs ~100-300MB and 1-3 seconds, so launching one per
// request does not survive concurrency. Instead we keep a single shared browser
// for the lifetime of the process and open/close a lightweight page per render.
//
// Two safeguards sit around that shared instance:
//   - a concurrency gate, so a burst of downloads queues instead of opening an
//     unbounded number of tabs;
//   - liveness checks plus a relaunch path, so a crashed browser recovers on
//     the next request rather than wedging the route permanently.
//
// Deployment note: on serverless platforms (e.g. Vercel) replace `puppeteer`
// with `puppeteer-core` + `@sparticuz/chromium` (see the README). The singleton
// still helps there — it survives for the life of a warm lambda.

import puppeteer from "puppeteer";
import { PRINT_MARGIN_IN } from "@/lib/cvTemplateMeta";

const PAGE_TIMEOUT_MS = 10_000;
// Chrome tabs are cheap next to a whole browser, but not free. Four in flight
// keeps memory predictable on a small host while absorbing normal bursts.
const MAX_CONCURRENT_RENDERS = 4;
const QUEUE_TIMEOUT_MS = 20_000;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--font-render-hinting=none",
];

// Survives hot reload in development, where the module is re-evaluated.
const globalForPdf = globalThis;

let browserPromise = globalForPdf.__cvBrowserPromise || null;
let active = 0;
const waiters = [];

async function launch() {
  const browser = await puppeteer.launch({ headless: "new", args: LAUNCH_ARGS });
  // If Chrome dies (OOM, crash), drop the handle so the next call relaunches.
  browser.on("disconnected", () => {
    browserPromise = null;
    globalForPdf.__cvBrowserPromise = null;
  });
  return browser;
}

// Returns the shared browser, launching or relaunching it as needed.
async function getBrowser() {
  if (browserPromise) {
    try {
      const existing = await browserPromise;
      if (existing.connected !== false && existing.isConnected?.() !== false) {
        return existing;
      }
    } catch {
      // Fall through and relaunch.
    }
  }
  browserPromise = launch().catch((e) => {
    // Never cache a failed launch — the next request should retry.
    browserPromise = null;
    globalForPdf.__cvBrowserPromise = null;
    throw e;
  });
  globalForPdf.__cvBrowserPromise = browserPromise;
  return browserPromise;
}

// Concurrency gate. Resolves when a render slot is free, rejects if the queue
// is backed up long enough that the caller is better off failing fast.
function acquireSlot() {
  if (active < MAX_CONCURRENT_RENDERS) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const waiter = {
      resolve,
      reject,
      timer: setTimeout(() => {
        const i = waiters.indexOf(waiter);
        if (i !== -1) waiters.splice(i, 1);
        reject(new Error("PDF renderer is busy. Please try again in a moment."));
      }, QUEUE_TIMEOUT_MS),
    };
    waiters.push(waiter);
  });
}

function releaseSlot() {
  const next = waiters.shift();
  if (next) {
    clearTimeout(next.timer);
    next.resolve();
    return; // The slot transfers directly; `active` stays the same.
  }
  active = Math.max(0, active - 1);
}

// Renders a full HTML document to an A4 PDF buffer.
export async function htmlToPdf(html) {
  await acquireSlot();

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);

    // The CV is fully self-contained (inline CSS, web-safe fonts, no network
    // requests), so "domcontentloaded" is the correct and fastest signal here —
    // "networkidle0" would just wait out the idle window for nothing.
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_TIMEOUT_MS,
    });

    // Fonts are all system fonts, but this guards against a fallback flash.
    await page.evaluateHandle("document.fonts.ready");

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: `${PRINT_MARGIN_IN}in`,
        right: `${PRINT_MARGIN_IN}in`,
        bottom: `${PRINT_MARGIN_IN}in`,
        left: `${PRINT_MARGIN_IN}in`,
      },
      timeout: PAGE_TIMEOUT_MS,
    });
  } finally {
    // Close the page, never the browser — it is shared.
    if (page) {
      await page.close().catch(() => {});
    }
    releaseSlot();
  }
}

// Closes the shared browser. Useful for tests and graceful shutdown.
export async function closePdfBrowser() {
  const pending = browserPromise;
  browserPromise = null;
  globalForPdf.__cvBrowserPromise = null;
  if (!pending) return;
  try {
    const browser = await pending;
    await browser.close();
  } catch {
    // Already gone.
  }
}
