/**
 * pushService  suporte, permissão, subscrição e envio de teste.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createFakeSupabase } import test description
import { DEFAULT_PUSH_PREFERENCES } from "../utils/pushPayload.js";

const {
  fake,
  resetFakeSupabase,
  setAuthUser,
  seedPushPreferences,
  seedPushSubscription,
} = vi.hoisted(() => {
  const fake = createFakeSupabase();
  return {
    fake,
    resetFakeSupabase: () => fake.reset(),
    setAuthUser: (user) => fake.setAuthUser(user),
    seedPushPreferences: (prefs) => fake.seed("push_preferences", prefs),
    seedPushSubscription: (sub) => fake.seed("push_subscriptions", sub),
  };
});

vi.mock("@supabase/supabase-js", async () => {
  const actual = await import("@supabase/supabase-js");
  return {
    ...actual,
    createClient: () => fake.client,
  };
});

vi.mock("../lib/supabase.js", () => ({
  supabase: fake.client,
}));

const VAPID_PUBLIC_KEY = "BHv7Z...fake...key";

let loadService;
let originalNavigator;
let originalWindow;

beforeEach(() => {
  resetFakeSupabase();
    const authUser = { id: "auth-1", email: "aluno@example.com" };
    setAuthUser(authUser);
    fake.seed("profiles", {
      id: "profile-1",
      auth_user_id: authUser.id,
      name: "Aluno",
      username: "aluno",
    });

    originalNavigator = global.navigator;
    originalWindow = global.window;

    global.window = {
      PushManager: function PushManager() {},
      matchMedia: vi.fn(() => ({ matches: false })),
      navigator: {},
    };
    global.navigator = {
      serviceWorker: {
        getRegistration: vi.fn(),
        register: vi.fn(),
      },
      userAgent: "Chrome",
    };
    global.Notification = {
      permission: "default",
      requestPermission: vi.fn(),
    };
  });
'});
