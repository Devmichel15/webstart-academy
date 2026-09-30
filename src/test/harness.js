/**
 * Test harness.
 *
 * Replaces `src/lib/supabase.js` with the in-memory double and re-imports the
 * app modules on demand. Every app module must be imported *after*
 * `mockSupabase()` runs, so this file exposes async loaders instead of the
 * services themselves.
 *
 * Why not `vi.mock` + static imports: `vi.mock` is hoisted per test file, and
 * the fake needs per-test data (tables, auth users, session). Registering the
 * mock first and importing afterwards keeps one code path for every test.
 */
import { vi } from "vitest";
import { createFakeSupabase } from "./fakeSupabase.js";

/** Registers the in-memory Supabase for this test file. */
export function mockSupabase(options = {}) {
  const fake = createFakeSupabase(options);
  vi.doMock("../lib/supabase.js", () => ({ supabase: fake }));
  return fake;
}

/** Drops the module cache so the next dynamic import sees the new mock. */
export function resetModules() {
  vi.resetModules();
}

export async function loadUserService() {
  return import("../services/userService.js");
}

export async function loadLearningProfileService() {
  return import("../services/learningProfileService.js");
}

export async function loadAuthService() {
  return import("../services/authService.js");
}

export async function loadProgressService() {
  return import("../services/progressService.js");
}

export async function loadTrailProgressService() {
  return import("../services/trailProgressService.js");
}

/** Loads AuthProvider + ProgressProvider + the guards in one go. */
export async function loadAppModules() {
  const [authContext, progressContext, userService, learningProfileService, authService, progressService] =
    await Promise.all([
      import("../contexts/AuthContext.jsx"),
      import("../contexts/ProgressContext.jsx"),
      import("../services/userService.js"),
      import("../services/learningProfileService.js"),
      import("../services/authService.js"),
      import("../services/progressService.js"),
    ]);

  return {
    AuthProvider: authContext.AuthProvider,
    useAuthContext: authContext.useAuthContext,
    ProgressProvider: progressContext.ProgressProvider,
    useProgress: progressContext.useProgressContext,
    userService,
    learningProfileService,
    authService,
    progressService,
  };
}
