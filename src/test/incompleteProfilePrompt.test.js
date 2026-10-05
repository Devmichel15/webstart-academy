/**
 * Política de insistência do modal de "falta-te um nome".
 *
 * A lógica saiu do componente para um módulo próprio, e é isto que a torna
 * testável sem React: o cooldown é a parte que mais facilmente fica mal, porque
 * localStorage só existe no browser e pode estar bloqueado.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  DISMISS_COOLDOWN_MS,
  DISMISS_STORAGE_KEY,
  clearDismissal,
  isInCooldown,
  persistDismissedAt,
  readDismissedAt,
} from "../utils/incompleteProfilePrompt.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

function hostileStorage() {
  return {
    getItem() {
      throw new Error("localStorage bloqueado");
    },
    setItem() {
      throw new Error("localStorage bloqueado");
    },
    removeItem() {
      throw new Error("localStorage bloqueado");
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("persistir o adiamento", () => {
  it("guarda um timestamp legível", () => {
    const storage = memoryStorage();
    persistDismissedAt(storage, 1234);
    expect(storage.data[DISMISS_STORAGE_KEY]).toBe("1234");
    expect(readDismissedAt(storage)).toBe(1234);
  });

  it("usa o browser por omissão", () => {
    persistDismissedAt(window.localStorage, 999);
    expect(window.localStorage.getItem(DISMISS_STORAGE_KEY)).toBe("999");
  });

  it("limpa o estado guardado", () => {
    persistDismissedAt(window.localStorage, 999);
    clearDismissal(window.localStorage);
    expect(window.localStorage.getItem(DISMISS_STORAGE_KEY)).toBeNull();
  });
});

describe("ler um estado guardado", () => {
  it("não tem nada → null", () => {
    expect(readDismissedAt(window.localStorage)).toBeNull();
  });

  it("ignora lixo em vez de devolver NaN", () => {
    expect(readDismissedAt(memoryStorage({ [DISMISS_STORAGE_KEY]: "amanhã" }))).toBeNull();
    expect(readDismissedAt(memoryStorage({ [DISMISS_STORAGE_KEY]: "" }))).toBeNull();
  });

  it("não rebenta se o storage estiver bloqueado", () => {
    expect(readDismissedAt(hostileStorage())).toBeNull();
    expect(() => persistDismissedAt(hostileStorage(), 1)).not.toThrow();
    expect(() => clearDismissal(hostileStorage())).not.toThrow();
  });
});

describe("cooldown de 24 horas", () => {
  it("não está em cooldown se nunca foi adiado", () => {
    expect(isInCooldown(null)).toBe(false);
    expect(isInCooldown(undefined)).toBe(false);
  });

  it("silencia logo a seguir a adiar", () => {
    const at = Date.now();
    expect(isInCooldown(at, at)).toBe(true);
    expect(isInCooldown(at, at + DISMISS_COOLDOWN_MS - 1)).toBe(true);
  });

  it("volta a mostrar assim que passa", () => {
    const at = Date.now();
    expect(isInCooldown(at, at + DISMISS_COOLDOWN_MS)).toBe(false);
    expect(isInCooldown(at, at + 25 * 60 * 60 * 1000)).toBe(false);
  });

  it("um timestamp no futuro também silencia", () => {
    const now = Date.now();
    expect(isInCooldown(now + 60 * 60 * 1000, now)).toBe(true);
  });

  it("mede o cooldown a partir do que está no browser", () => {
    persistDismissedAt(window.localStorage, Date.now());
    expect(isInCooldown(readDismissedAt(window.localStorage))).toBe(true);
    clearDismissal(window.localStorage);
    expect(isInCooldown(readDismissedAt(window.localStorage))).toBe(false);
  });
});