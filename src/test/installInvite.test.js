/**
 * ETAPA 1 (PWA) — estado do convite de instalação.
 *
 * Cobre a persistência das preferências (recusa / já convidado / registo
 * pendente) e as regras que decidem a quem é mostrado o convite.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  INSTALL_DISMISSED_KEY,
  INSTALL_INVITED_KEY,
  clearInstallDismissal,
  clearRegistrationPending,
  hasBeenInvited,
  isFreshlyCreatedAccount,
  isInstallDismissed,
  markInstallDismissed,
  markInvited,
  markRegistrationPending,
  readRegistrationPending,
  registrationPendingMatches,
} from "../utils/installInvite.js";

const UID = "11111111-1111-4111-8111-111111111111";
const OTHER_UID = "22222222-2222-4222-8222-222222222222";

describe("installInvite — recusa do convite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("não está recusado por omissão", () => {
    expect(isInstallDismissed()).toBe(false);
  });

  it("guarda a recusa no dispositivo", () => {
    markInstallDismissed();
    expect(isInstallDismissed()).toBe(true);
    expect(localStorage.getItem(INSTALL_DISMISSED_KEY)).toBe("true");
  });

  it("limpa a recusa (ex.: depois de instalar)", () => {
    markInstallDismissed();
    clearInstallDismissal();
    expect(isInstallDismissed()).toBe(false);
  });

  it("não rebenta quando o storage está bloqueado", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage bloqueado");
      },
    });

    try {
      expect(() => markInstallDismissed()).not.toThrow();
      expect(isInstallDismissed()).toBe(false);
    } finally {
      if (original) Object.defineProperty(window, "localStorage", original);
    }
  });
});

describe("installInvite — convite já apresentado", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("separa convites por conta", () => {
    expect(hasBeenInvited(UID)).toBe(false);
    markInvited(UID);
    expect(hasBeenInvited(UID)).toBe(true);
    expect(hasBeenInvited(OTHER_UID)).toBe(false);
    expect(localStorage.getItem(INSTALL_INVITED_KEY)).toBe(UID);
  });
});

describe("installInvite — registo pendente", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("guarda e lê o registo pendente com o id da conta", () => {
    markRegistrationPending(UID);
    const pending = readRegistrationPending();
    expect(pending?.userId).toBe(UID);
    expect(pending?.at).toBeGreaterThan(0);
  });

  it("limpa o registo pendente", () => {
    markRegistrationPending(UID);
    clearRegistrationPending();
    expect(readRegistrationPending()).toBeNull();
  });

  it("só corresponde à conta que acabou de ser criada", () => {
    const pending = { userId: UID, at: Date.now() };
    expect(registrationPendingMatches(pending, { id: UID })).toBe(true);
    expect(registrationPendingMatches(pending, { id: OTHER_UID })).toBe(false);
    expect(registrationPendingMatches(pending, null)).toBe(false);
  });

  it("expira quando o registo pendente já é antigo", () => {
    const pending = { userId: UID, at: Date.now() - 25 * 60 * 60 * 1000 };
    expect(registrationPendingMatches(pending, { id: UID })).toBe(false);
  });

  it("sem registo pendente nada é mostrado", () => {
    expect(registrationPendingMatches(null, { id: UID })).toBe(false);
  });

  it("no OAuth (sem id conhecido) só aceita contas mesmo novas", () => {
    const pending = { userId: null, at: Date.now() };
    const now = Date.now();

    expect(
      registrationPendingMatches(pending, {
        id: UID,
        created_at: new Date(now - 60_000).toISOString(),
      }),
    ).toBe(true);

    expect(
      registrationPendingMatches(pending, {
        id: UID,
        created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      }),
    ).toBe(false);
  });
});

describe("installInvite — conta recém-criada", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");

  it("aceita uma conta criada há segundos", () => {
    expect(
      isFreshlyCreatedAccount(
        { created_at: new Date(now - 5_000).toISOString() },
        now,
      ),
    ).toBe(true);
  });

  it("rejeita uma conta antiga", () => {
    expect(
      isFreshlyCreatedAccount(
        { created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
        now,
      ),
    ).toBe(false);
  });

  it("tolera um desvio de relógio entre o browser e o servidor", () => {
    expect(
      isFreshlyCreatedAccount(
        { created_at: new Date(now + 30_000).toISOString() },
        now,
      ),
    ).toBe(true);
  });

  it("sem created_at assume conta nova (o convite nunca bloqueia)", () => {
    expect(isFreshlyCreatedAccount({ id: UID }, now)).toBe(true);
  });
});
