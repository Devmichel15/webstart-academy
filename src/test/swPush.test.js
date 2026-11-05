/**
 * ETAPA 2 (Web Push) — Service Worker.
 *
 * Testa o `public/sw.js` REAL (não uma cópia): os handlers de push e de
 * clique têm de mostrar a notificação e abrir um caminho interno da
 * aplicação, e o que já existia (Workbox, pré-cache) tem de continuar
 * intacto.
 */
import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

vi.mock("workbox-precaching", () => ({
  cleanupOutdatedCaches: vi.fn(),
  matchPrecache: vi.fn(async () => null),
  precacheAndRoute: vi.fn(),
}));
vi.mock("workbox-routing", () => ({ registerRoute: vi.fn() }));
vi.mock("workbox-strategies", () => ({
  CacheFirst: class {},
  NetworkFirst: class {},
  NetworkOnly: class {},
}));
vi.mock("workbox-expiration", () => ({ ExpirationPlugin: class {} }));
vi.mock("workbox-core", () => ({ clientsClaim: vi.fn() }));

const listeners = {};
// `clearMocks` limpa as chamadas antes de cada teste, por isso o que o SW
// fez no import é guardado aqui.
let importStats = { precache: 0, routes: 0 };

beforeAll(async () => {
  window.skipWaiting = vi.fn();
  window.registration = { showNotification: vi.fn(async () => {}) };
  window.clients = {
    matchAll: vi.fn(async () => []),
    openWindow: vi.fn(async () => ({})),
  };

  vi.spyOn(window, "addEventListener").mockImplementation((type, handler) => {
    listeners[type] = handler;
  });

  await import("../../public/sw.js");

  importStats = {
    precache: precacheAndRoute.mock.calls.length,
    routes: registerRoute.mock.calls.length,
  };
});

beforeEach(() => {
  window.registration.showNotification.mockClear();
  window.clients.matchAll.mockResolvedValue([]);
  window.clients.openWindow.mockClear();
});

function makeEvent(data) {
  const waits = [];
  return {
    waits,
    data: {
      json: () => data,
      text: () => JSON.stringify(data),
    },
    notification: { close: vi.fn(), data },
    waitUntil: (promise) => waits.push(promise),
  };
}

describe("Service Worker — registo", () => {
  it("continua a usar o Workbox (pré-cache e rotas)", () => {
    expect(importStats.precache).toBeGreaterThan(0);
    expect(importStats.routes).toBeGreaterThan(0);
  });

  it("regista os handlers de push", () => {
    expect(typeof listeners.push).toBe("function");
    expect(typeof listeners.notificationclick).toBe("function");
    expect(typeof listeners.pushsubscriptionchange).toBe("function");
  });
});

describe("Service Worker — push", () => {
  it("mostra a notificação com o payload recebido", async () => {
    const event = makeEvent({
      title: "Teste de notificação",
      body: "Se recebeste isto, as notificações push estão a funcionar.",
      url: "/perfil",
      category: "learning",
      tag: "webstart-learning",
    });

    listeners.push(event);
    await Promise.all(event.waits);

    expect(window.registration.showNotification).toHaveBeenCalledTimes(1);
    const [title, options] = window.registration.showNotification.mock.calls[0];
    expect(title).toBe("Teste de notificação");
    expect(options.body).toMatch(/notificações push/);
    expect(options.tag).toBe("webstart-learning");
    expect(options.data.url).toBe("/perfil");
    expect(options.data.category).toBe("learning");
  });

  it("não deixa um destino externo na notificação", async () => {
    const event = makeEvent({
      title: "Máquina",
      body: "clica aqui",
      url: "https://exemplo.com/ phishing",
    });

    listeners.push(event);
    await Promise.all(event.waits);

    const [, options] = window.registration.showNotification.mock.calls[0];
    expect(options.data.url).toBe("/");
  });

  it("usa um payload de texto quando o JSON não é válido", async () => {
    const event = makeEvent(null);
    event.data.json = () => {
      throw new Error("not json");
    };
    event.data.text = () => "texto simples";

    listeners.push(event);
    await Promise.all(event.waits);

    const [title, options] = window.registration.showNotification.mock.calls[0];
    expect(title).toBe("WebStart Academy");
    expect(options.body).toBe("texto simples");
  });
});

describe("Service Worker — clique na notificação", () => {
  it("foca a janela já aberta no destino", async () => {
    const focus = vi.fn();
    const navigate = vi.fn(async () => {});
    window.clients.matchAll.mockResolvedValue([
      { url: "https://webstart.test/outra", focus, navigate },
      { url: "https://webstart.test/perfil", focus, navigate },
    ]);

    const event = makeEvent({ url: "/perfil" });
    listeners.notificationclick(event);
    await Promise.all(event.waits);

    expect(event.notification.close).toHaveBeenCalled();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/perfil");
    expect(window.clients.openWindow).not.toHaveBeenCalled();
  });

  it("abre uma janela nova quando não há nenhuma aberta", async () => {
    window.clients.matchAll.mockResolvedValue([]);

    const event = makeEvent({ url: "/perfil" });
    listeners.notificationclick(event);
    await Promise.all(event.waits);

    expect(window.clients.openWindow).toHaveBeenCalledWith("/perfil");
  });

  it("um destino externo abre a raiz da aplicação", async () => {
    window.clients.matchAll.mockResolvedValue([]);

    const event = makeEvent({ url: "https://exemplo.com" });
    listeners.notificationclick(event);
    await Promise.all(event.waits);

    expect(window.clients.openWindow).toHaveBeenCalledWith("/");
  });
});

describe("Service Worker — subscrição caducada", () => {
  it("pede ao cliente que volte a subscrever", async () => {
    const postMessage = vi.fn();
    window.clients.matchAll.mockResolvedValue([{ postMessage }]);

    const event = makeEvent(null);
    listeners.pushsubscriptionchange(event);
    await Promise.all(event.waits);

    expect(postMessage).toHaveBeenCalledWith({
      type: "PUSH_SUBSCRIPTION_CHANGED",
    });
  });
});
