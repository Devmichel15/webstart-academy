import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABELS,
  DEFAULT_PUSH_PREFERENCES,
  PUSH_CATEGORIES,
  buildPushPayload,
  isInternalPath,
  normalizeInternalPath,
  resolveNotificationTarget,
} from "../utils/pushPayload.js";

describe("pushPayload - destinos internos", () => {
  it("aceita caminhos internos", () => {
    expect(isInternalPath("/perfil")).toBe(true);
    expect(isInternalPath("/aula/123?tab=2")).toBe(true);
    expect(isInternalPath("/trilhas/javascript")).toBe(true);
  });

  it("recusa URLs absolutas, esquemas perigosos e valores inválidos", () => {
    expect(isInternalPath("https://exemplo.com")).toBe(false);
    expect(isInternalPath("http://exemplo.com/x")).toBe(false);
    expect(isInternalPath("//exemplo.com")).toBe(false);
    expect(isInternalPath("/\\exemplo.com")).toBe(false);
    expect(isInternalPath("/perfil\\..\\..")).toBe(false);
    expect(isInternalPath("javascript:alert(1)")).toBe(false);
    expect(isInternalPath("perfil")).toBe(false);
    expect(isInternalPath("")).toBe(false);
    expect(isInternalPath(null)).toBe(false);
    expect(isInternalPath(42)).toBe(false);
    expect(isInternalPath({})).toBe(false);
  });

  it("normaliza destinos não internos para a raiz", () => {
    expect(normalizeInternalPath("/perfil")).toBe("/perfil");
    expect(normalizeInternalPath("  /perfil  ")).toBe("/perfil");
    expect(normalizeInternalPath("https://exemplo.com")).toBe("/");
    expect(normalizeInternalPath(undefined)).toBe("/");
  });

  it("resolve o destino absoluto a partir da origem", () => {
    expect(resolveNotificationTarget("/perfil", "https://webstart.test")).toBe(
      "https://webstart.test/perfil",
    );
    expect(resolveNotificationTarget("https://exemplo.com", "https://webstart.test")).toBe(
      "https://webstart.test/",
    );
  });
});

describe("pushPayload - payload", () => {
  it("limpa título, corpo e destino", () => {
    const payload = buildPushPayload({
      title: "  Teste  ",
      body: "  Olá  ",
      url: "  /perfil  ",
    });

    expect(payload.title).toBe("Teste");
    expect(payload.body).toBe("Olá");
    expect(payload.url).toBe("/perfil");
  });

  it("usa valores por omissão quando falta informação", () => {
    const payload = buildPushPayload();
    expect(payload.title).toBe("WebStart Academy");
    expect(payload.body).toBe("Tens uma nova notificação.");
    expect(payload.url).toBe("/");
    expect(payload.category).toBe("learning");
    expect(payload.tag).toBe("webstart-learning");
  });

  it("recusa categorias desconhecidas e cai na categoria por omissão", () => {
    expect(buildPushPayload({ category: "inventada" }).category).toBe("learning");
    expect(buildPushPayload({ category: "streak" }).category).toBe("streak");
    expect(buildPushPayload({ category: "streak" }).tag).toBe("webstart-streak");
  });

  it("impede que um destino externo entre no payload", () => {
    expect(buildPushPayload({ url: "https://exemplo.com" }).url).toBe("/");
  });

  it("expõe as categorias e os defaults usados pelo servidor", () => {
    expect(PUSH_CATEGORIES).toContain("learning");
    expect(PUSH_CATEGORIES).toContain("reminders");
    expect(PUSH_CATEGORIES).toContain("study_activity");
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(
      [...PUSH_CATEGORIES].sort(),
    );
    expect(DEFAULT_PUSH_PREFERENCES.push_enabled).toBe(false);
    expect(DEFAULT_PUSH_PREFERENCES.reminders_enabled).toBe(false);
    expect(DEFAULT_PUSH_PREFERENCES.learning_enabled).toBe(true);
    expect(DEFAULT_PUSH_PREFERENCES.study_activity_enabled).toBe(true);
  });
});
