// Global test setup: jsdom polyfills + deterministic `import.meta.env`.
// The Supabase client is always replaced by the in-memory double in each test
// file, so the values here only exist to keep `src/lib/supabase.js` from
// throwing if a test ever imports it for real, and to make sure a developer's
// local .env cannot change test behaviour.
import { vi } from "vitest";

// Forced (not `||=`) so a real .env in the repo cannot leak into assertions.
import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
import.meta.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
import.meta.env.VITE_ADMIN_EMAIL = "admin@webstart.test";
import.meta.env.VITE_API_KEY = "";
import.meta.env.VITE_ENABLE_FIREBASE_LEGACY_READ = "false";
import.meta.env.VITE_LEGACY_READ_URL = "";
import.meta.env.DEV = true;

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
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

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// `src/services/aiService.js` / auth flows log technical errors on purpose.
// Swallow the noise but keep a handle on it so tests can assert if needed.
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
