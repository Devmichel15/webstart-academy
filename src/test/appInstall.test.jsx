/**
 * Rastreio de instalação da PWA (migration 027).
 *
 * O sinal de instalação vem do browser (`display-mode: standalone` ou evento
 * `appinstalled`). O que estes testes garantem é o que está do nosso lado:
 * marcar a conta certa, uma vez por dispositivo, e nunca rebentar a app se a
 * RPC falhar.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { mockSupabase } from "./harness.js";
import { makeAuthUser, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const EMAIL = "maria@webstart.test";

let fake;

function sessionUser() {
  return { id: AUTH_UID, email: EMAIL };
}

function setStandalone(standalone) {
  window.matchMedia = vi.fn((query) => ({
    matches: standalone && query.includes("display-mode: standalone"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  fake = mockSupabase({
    authUsers: [makeAuthUser({ id: AUTH_UID, email: EMAIL, name: "Maria Silva" })],
  });
  fake.db.profiles.push(makeProfile({ id: AUTH_UID, email: EMAIL }));
  fake.setSession(sessionUser());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("syncAppInstalled", () => {
  it("marca a conta com a plataforma e a data da primeira instalação", async () => {
    const { syncAppInstalled } = await import("../services/appInstallService.js");

    await expect(syncAppInstalled(AUTH_UID, "android")).resolves.toEqual({
      synced: true,
    });

    const row = fake.profileById(AUTH_UID);
    expect(row.app_installed).toBe(true);
    expect(row.app_installed_platform).toBe("android");
    expect(row.app_installed_at).toBeTruthy();
  });

  it("não repete a chamada no mesmo dispositivo", async () => {
    const { syncAppInstalled } = await import("../services/appInstallService.js");

    await syncAppInstalled(AUTH_UID, "android");
    const callsAfterFirst = fake.rpcCalls.filter(
      (call) => call.fnName === "mark_app_installed",
    ).length;

    await expect(syncAppInstalled(AUTH_UID, "android")).resolves.toEqual({
      synced: false,
      reason: "already-synced",
    });

    const callsAfterSecond = fake.rpcCalls.filter(
      (call) => call.fnName === "mark_app_installed",
    ).length;
    expect(callsAfterSecond).toBe(callsAfterFirst);
  });

  it("não chama a RPC sem sessão", async () => {
    const { syncAppInstalled } = await import("../services/appInstallService.js");

    await expect(syncAppInstalled(null, "desktop")).resolves.toEqual({
      synced: false,
      reason: "no-user",
    });
    expect(fake.rpcCalls ?? []).toHaveLength(0);
  });

  it("propaga o erro e deixa tentar de novo (não grava a guarda local)", async () => {
    const { syncAppInstalled } = await import("../services/appInstallService.js");

    fake.failRpc("mark_app_installed", new Error("boom"));
    await expect(syncAppInstalled(AUTH_UID, "desktop")).rejects.toThrow("boom");

    await expect(syncAppInstalled(AUTH_UID, "desktop")).resolves.toEqual({
      synced: true,
    });
    expect(fake.profileById(AUTH_UID).app_installed).toBe(true);
  });
});

describe("AppInstallTracker", () => {
  it("marca a conta quando a app arranca instalada (standalone)", async () => {
    setStandalone(true);

    const [{ AuthProvider }, { InstallProvider }, { AppInstallTracker }] =
      await Promise.all([
        import("../contexts/AuthContext.jsx"),
        import("../contexts/InstallContext.jsx"),
        import("../components/pwa/AppInstallTracker.jsx"),
      ]);

    render(
      <AuthProvider>
        <InstallProvider>
          <AppInstallTracker />
        </InstallProvider>
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(fake.profileById(AUTH_UID).app_installed).toBe(true),
    );
  });

  it("não marca nada quando a app corre no navegador", async () => {
    setStandalone(false);

    const [{ AuthProvider }, { InstallProvider }, { AppInstallTracker }] =
      await Promise.all([
        import("../contexts/AuthContext.jsx"),
        import("../contexts/InstallContext.jsx"),
        import("../components/pwa/AppInstallTracker.jsx"),
      ]);

    render(
      <AuthProvider>
        <InstallProvider>
          <AppInstallTracker />
        </InstallProvider>
      </AuthProvider>,
    );

    await waitFor(() => expect(fake.profileById(AUTH_UID)).not.toBeNull());
    expect(fake.profileById(AUTH_UID).app_installed).toBe(false);
    expect(
      (fake.rpcCalls ?? []).filter(
        (call) => call.fnName === "mark_app_installed",
      ),
    ).toHaveLength(0);
  });
});
