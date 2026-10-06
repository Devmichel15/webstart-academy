/**
 * Tarefa 3 — Caminhos de erro de rede/Supabase nos serviços.
 *
 * Cobre: timeout, HTTP 500, RLS (42501), FK (23503), resposta nula e
 * erro transitório que se recupera. Verifica duas coisas em cada caso:
 *  1. o erro NÃO é engolido (a função rejeita/lança com o erro original);
 *  2. a política de retry distingue permanente de transitório.
 *
 * `withRetry` usa `setTimeout` para backoff, por isso todos os testes correm
 * com fake timers e avançam o relógio explicitamente.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { mockSupabase, loadUserService, loadLearningProfileService, loadProgressService } from "./harness.js";
import { makeProfile, postgrestError } from "./fakeSupabase.js";
import { toUserMessage } from "../utils/errors.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";

const TIMEOUT = Object.assign(new Error("fetch failed: request timed out"), {
  name: "TypeError",
});
const SERVER_500 = Object.assign(new Error("Internal Server Error"), { status: 500 });
const RLS_42501 = postgrestError("new row violates row-level security policy", "42501");
const FK_23503 = postgrestError(
  'insert or update on table "lesson_progress" violates foreign key constraint "fk"',
  "23503",
);

let fake;
let userService;
let learningProfileService;
let progressService;

function seedProfile(overrides = {}) {
  fake.db.profiles.length = 0;
  fake.db.profiles.push(
    makeProfile({ id: AUTH_UID, name: "Maria", email: "maria@webstart.test", ...overrides }),
  );
  fake.setSession({ id: AUTH_UID });
}

/** Corre `fn` deixando o relógio virtual avançar o suficiente para o backoff. */
async function withClock(fn) {
  const promise = fn();
  // Liga já um handler no-op: durante o avanço do relógio as tentativas internas
  // do withRetry rejeitam, e sem isto o Node reporta "unhandled rejection".
  // A promise continua a rejeitar para quem a aguarda.
  promise.catch(() => {});
  for (let i = 0; i < 20; i += 1) await vi.advanceTimersByTimeAsync(1000);
  return promise;
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  fake = mockSupabase();
  userService = await loadUserService();
  learningProfileService = await loadLearningProfileService();
  progressService = await loadProgressService();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getUserProfile — erros", () => {
  it("propaga o timeout em vez de devolver null", async () => {
    seedProfile();
    fake.setError(TIMEOUT);

    await expect(withClock(() => userService.getUserProfile(AUTH_UID))).rejects.toThrow(
      /timed out/i,
    );
  });

  it("propaga o HTTP 500", async () => {
    seedProfile();
    fake.setError(SERVER_500);

    await expect(withClock(() => userService.getUserProfile(AUTH_UID))).rejects.toThrow(
      /Internal Server Error/,
    );
  });

  it("propaga o erro de RLS (42501)", async () => {
    seedProfile();
    fake.setError(RLS_42501);

    await expect(
      withClock(() => userService.getUserProfile(AUTH_UID)),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("devolve null (não lança) quando o utilizador simplesmente não existe", async () => {
    fake.db.profiles.length = 0;
    fake.setSession({ id: AUTH_UID });

    await expect(userService.getUserProfile(AUTH_UID)).resolves.toBeNull();
  });
});

describe("createUserProfile — erros", () => {
  it("propaga o erro de RLS ao caller (AuthContext mostra mensagem)", async () => {
    seedProfile();
    fake.setError(RLS_42501);

    await expect(
      withClock(() =>
        userService.createUserProfile({ id: AUTH_UID, email: "maria@webstart.test" }, {
          name: "Maria",
        }),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("propaga a falha da migração de perfil legado", async () => {
    seedProfile({ legacy: true });
    fake.failRpc("link_legacy_profile", FK_23503);

    await expect(
      withClock(() =>
        userService.createUserProfile({ id: AUTH_UID, email: "maria@webstart.test" }, {
          name: "Maria",
        }),
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
});

describe("getLearningProfile / isAssessmentCompleted — erros", () => {
  it("getLearningProfile propaga timeout", async () => {
    seedProfile();
    fake.setError(TIMEOUT);

    await expect(
      withClock(() => learningProfileService.getLearningProfile(AUTH_UID)),
    ).rejects.toThrow();
  });

  it("getLearningProfile propaga HTTP 500", async () => {
    seedProfile();
    fake.setError(SERVER_500);

    await expect(
      withClock(() => learningProfileService.getLearningProfile(AUTH_UID)),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("getLearningProfile propaga RLS (42501)", async () => {
    seedProfile();
    fake.setError(RLS_42501);

    await expect(
      withClock(() => learningProfileService.getLearningProfile(AUTH_UID)),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("getLearningProfile propaga FK (23503) na resolução do perfil", async () => {
    seedProfile();
    fake.setError(FK_23503);

    await expect(
      withClock(() => learningProfileService.getLearningProfile(AUTH_UID)),
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("devolve null quando não há learning_profile (não é erro)", async () => {
    seedProfile();

    await expect(learningProfileService.getLearningProfile(AUTH_UID)).resolves.toBeNull();
  });

  it("isAssessmentCompleted devolve false em vez de rebentar", async () => {
    seedProfile();
    fake.setError(SERVER_500);

    await expect(
      withClock(() => learningProfileService.isAssessmentCompleted(AUTH_UID)),
    ).resolves.toBe(false);
  });
});

describe("getUserProgress — retry", () => {
  it("um erro transitório que se recupera devolve os dados", async () => {
    seedProfile();
    fake.injectError(SERVER_500);

    const rows = await withClock(() => progressService.getUserProgress(AUTH_UID));

    expect(rows).toEqual([]);
  });

  it("repete a query 3x num erro 500 persistente e depois propaga", async () => {
    seedProfile();
    fake.setError(SERVER_500);

    await expect(
      withClock(() => progressService.getUserProgress(AUTH_UID)),
    ).rejects.toMatchObject({ status: 500 });

    // 3 tentativas (maxAttempts default = 3). A primeira query de cada
    // tentativa é a resolução do perfil, que também falha.
    expect(fake.queriesOn("profiles")).toBe(3);
  });

  it("NÃO repete num erro permanente de RLS (42501)", async () => {
    seedProfile();
    fake.setError(RLS_42501);

    await expect(
      withClock(() => progressService.getUserProgress(AUTH_UID)),
    ).rejects.toMatchObject({ code: "42501" });

    expect(fake.queriesOn("profiles")).toBe(1);
  });

  it("NÃO repete num erro permanente de FK (23503)", async () => {
    seedProfile();
    fake.setError(FK_23503);

    await expect(
      withClock(() => progressService.getUserProgress(AUTH_UID)),
    ).rejects.toMatchObject({ code: "23503" });

    expect(fake.queriesOn("profiles")).toBe(1);
  });

  it("repete num timeout (TypeError é treated como rede)", async () => {
    seedProfile();
    fake.setError(TIMEOUT);

    await expect(withClock(() => progressService.getUserProgress(AUTH_UID))).rejects.toThrow();

    expect(fake.queriesOn("profiles")).toBe(3);
  });
});

describe("completeLesson — erros", () => {
  function seedLesson() {
    fake.db.lessons.push({ id: "lesson-1", course_id: "c1", module_id: "m1" });
  }

  it("propaga RLS (42501) sem retentar", async () => {
    seedProfile();
    seedLesson();
    fake.setError(RLS_42501);

    await expect(
      withClock(() => progressService.completeLesson(AUTH_UID, "lesson-1")),
    ).rejects.toMatchObject({ code: "42501" });

    expect(fake.queriesOn("profiles")).toBe(1);
  });

  it("propaga HTTP 500 depois de 3 tentativas", async () => {
    seedProfile();
    seedLesson();
    fake.setError(SERVER_500);

    await expect(
      withClock(() => progressService.completeLesson(AUTH_UID, "lesson-1")),
    ).rejects.toMatchObject({ status: 500 });

    expect(fake.queriesOn("profiles")).toBe(3);
  });

  it("um erro transitório no insert não deixa XP gravado", async () => {
    seedProfile({ xp: 0, level: 1 });
    seedLesson();
    fake.setError(SERVER_500);

    await expect(
      withClock(() => progressService.completeLesson(AUTH_UID, "lesson-1")),
    ).rejects.toMatchObject({ status: 500 });

    // O XP só é creditado depois do insert da lesson_progress; nada foi gravado.
    expect(fake.profileById(AUTH_UID).xp).toBe(0);
    expect(fake.profileById(AUTH_UID).completed_lessons).toEqual([]);
    expect(fake.db.lesson_progress).toEqual([]);
  });
});

describe("subscribeToUserProgress — callback de erro", () => {
  it("chama onError (não rebenta) quando o perfil não pode ser resolvido", async () => {
    seedProfile();
    fake.setError(RLS_42501);

    const onError = vi.fn();
    const unsubscribe = progressService.subscribeToUserProgress(AUTH_UID, vi.fn(), onError);

    await vi.advanceTimersByTimeAsync(100);

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toMatchObject({ code: "42501" });
    unsubscribe();
  });

  describe("toUserMessage — catálogo de aulas ausente", () => {
    it("indica a migration necessária para a FK da aula", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = postgrestError(
        'insert or update on table "lesson_progress" violates foreign key constraint "lesson_progress_lesson_id_fkey"',
        "23503",
      );

      expect(toUserMessage(error, "Erro ao salvar progresso.")).toMatch(
        /016_seed_python_trail\.sql/,
      );
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("mantém a mensagem genérica para outras violações de FK", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = postgrestError(
        'insert or update on table "lesson_progress" violates foreign key constraint "other_fk"',
        "23503",
      );

      expect(toUserMessage(error, "Erro ao salvar progresso.")).toBe(
        "Erro ao salvar progresso.",
      );
      consoleError.mockRestore();
    });
  });

  it("unsubscribe antes da resolução não deixa callback pendurado", async () => {
    seedProfile();
    const onError = vi.fn();
    const unsubscribe = progressService.subscribeToUserProgress(AUTH_UID, vi.fn(), onError);

    unsubscribe();
    fake.setError(SERVER_500);
    await vi.advanceTimersByTimeAsync(100);

    // Nenhum erro deve escapar depois do unsubscribe.
    expect(onError).not.toHaveBeenCalled();
  });
});