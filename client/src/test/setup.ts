import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Server tests run under the "node" environment and share this same
// setupFiles entry (vitest doesn't scope setupFiles per environmentMatchGlobs
// rule); skip all DOM setup there since `window`/`Element` don't exist.
const isDom = typeof window !== "undefined";

if (isDom) {
  afterEach(() => {
    cleanup();
  });

  // jsdom does not implement these, but Radix UI primitives (Select, Dialog,
  // Slider) call them during pointer interactions / layout measurement.
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  if (typeof window.ResizeObserver === "undefined") {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  }

  if (typeof window.matchMedia === "undefined") {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  // Minimal google.maps stub so components that create markers/listeners
  // against a caller-supplied `google.maps.Map` instance (rather than loading
  // the real SDK themselves) can run under jsdom.
  class FakeAdvancedMarkerElement {
    map: unknown;
    position: unknown;
    content: unknown;
    title: unknown;
    private listeners: Record<string, Array<() => void>> = {};
    constructor(opts: Record<string, unknown>) {
      Object.assign(this, opts);
    }
    addListener(event: string, handler: () => void) {
      (this.listeners[event] ??= []).push(handler);
      return { remove: () => {} };
    }
  }

  (globalThis as unknown as { google: typeof google }).google = {
    maps: {
      marker: {
        AdvancedMarkerElement: FakeAdvancedMarkerElement,
      },
    },
  } as unknown as typeof google;
}
