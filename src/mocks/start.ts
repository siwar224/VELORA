/**
 * Starts the mock server, once, and lets callers wait for it ("ready gate").
 *
 * - MSW itself (browser.ts: msw/browser + the handlers + the seed generator) is a
 *   dynamic import, so it is never part of a page's initial JavaScript: it is
 *   fetched only on /admin and on the first open of the public "Order ahead" form.
 * - Never runs on the server (rejects there).
 * - `ensureMocks()` resolves only after the service worker is registered and
 *   controlling the page, so the first /api request can never hit a missing worker.
 */
let ready: Promise<void> | null = null;

export function ensureMocks(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("The mock API only runs in the browser."));
  if (!ready) {
    ready = import("./browser")
      .then(({ worker }) =>
        worker.start({
          onUnhandledRequest: "bypass", // everything that isn't /api (fonts, images, Next) is untouched
          quiet: true,
          serviceWorker: { url: "/mockServiceWorker.js" },
        }),
      )
      .then(() => undefined)
      .catch((error) => {
        ready = null; // let a later call (the Retry button) try again
        throw error;
      });
  }
  return ready;
}
