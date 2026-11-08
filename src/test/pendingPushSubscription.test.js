import { beforeEach, describe, expect, it, vi } from "vitest";

const { fakeSupabase } = vi.hoisted(() => ({
  fakeSupabase: {
    functions: { invoke: vi.fn() },
    rpc: vi.fn(),
  },
}));

vi.mock("../lib/supabase.js", () => ({ supabase: fakeSupabase }));

describe("subscrição push pendente antes do registo", () => {
  let subscription;
  let registration;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "AA");
    localStorage.clear();
    fakeSupabase.functions.invoke.mockReset().mockResolvedValue({
      data: { ok: true },
      error: null,
    });
    fakeSupabase.rpc.mockReset().mockResolvedValue({
      data: {},
      error: null,
    });

    subscription = {
      endpoint: "https://push.example.test/device",
      toJSON: () => ({ endpoint: "https://push.example.test/device" }),
    };
    registration = {
      pushManager: {
        getSubscription: vi.fn(async () => subscription),
        subscribe: vi.fn(async () => subscription),
      },
    };
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {},
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "default",
        requestPermission: vi.fn(async () => {
          window.Notification.permission = "granted";
          return "granted";
        }),
      },
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn(async () => registration),
        register: vi.fn(async () => registration),
      },
    });
  });

  it("guarda a subscrição local ao clicar e associa-a depois da autenticação", async () => {
    const service = await import("../services/pushService.js");

    await service.prepareNotificationsBeforeSignIn();

    expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(
      localStorage.getItem(service.PENDING_PUSH_SUBSCRIPTION_KEY),
    ).not.toBeNull();
    expect(fakeSupabase.functions.invoke).not.toHaveBeenCalled();

    await service.completePendingPushSubscription();

    expect(fakeSupabase.functions.invoke).toHaveBeenCalledWith(
      service.PUSH_SUBSCRIBE_FUNCTION,
      expect.objectContaining({
        body: expect.objectContaining({
          action: "subscribe",
          subscription: { endpoint: "https://push.example.test/device" },
        }),
      }),
    );
    expect(fakeSupabase.rpc).toHaveBeenCalledWith(
      "upsert_push_preferences",
      { p_patch: { push_enabled: true } },
    );
    expect(
      localStorage.getItem(service.PENDING_PUSH_SUBSCRIPTION_KEY),
    ).toBeNull();
  });
});
