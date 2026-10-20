/**
 * Tarefa 2 — Streak e XP com datas-limite.
 *
 * Nenhum teste toca na data real: `vi.useFakeTimers()` + `vi.setSystemTime()`
 * fixam o "agora" para que os limites de meia-noite e virada de dia sejam
 * determinísticos.
 *
 * O dia civil NÃO é o do browser: `src/utils/dates.js` fixa o produto em
 * `Africa/Luanda` (UTC+1 sem DST), para que "estudei hoje" signifique o mesmo
 * para toda a gente e o painel admin não dependa da máquina de quem o abre.
 * Consequência para estes testes: o `TZ` do processo é irrelevante para a chave
 * do dia. Alguns testes mudam o TZ de propósito, para provar que isso já não
 * muda nada — se um dia desses começar a falhar, é porque o pin de Luanda foi
 * perdido pelo caminho.
 *
 * Convenção: `D` = 2026-06-15 em Africa/Luanda. Todas as expectativas são
 * escritas em dias-civis de Luanda, nunca em UTC.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { mockSupabase, loadUserService, loadProgressService } from "./harness.js";
import { makeProfile } from "./fakeSupabase.js";
import { allLessons, allVideoLessons } from "../data/lessons/index.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const D = "2026-06-15";
const D_MINUS_1 = "2026-06-14";
const D_MINUS_3 = "2026-06-12";

/** 2026-06-15T12:00:00Z */
const NOON_UTC = new Date("2026-06-15T12:00:00.000Z");

let fake;
let userService;
let progressService;

/**
 * Sets the process timezone. The day key is pinned to Africa/Luanda, so this
 * exists to prove that the browser's timezone cannot move the streak.
 */
function setTz(tz) {
  // vi.stubEnv escreve em process.env por nós (evita `process` direto, que o
  // ESLint marca como no-undef neste ficheiro).
  vi.stubEnv("TZ", tz);
}

function at(isoString) {
  return new Date(isoString);
}

function seedProfile(overrides = {}) {
  // Limpa a tabela: vários `it` semeiam o mesmo id e uma segunda linha com o
  // mesmo id passaria a ser lida em vez da nova.
  fake.db.profiles.length = 0;
  fake.db.profiles.push(
    makeProfile({
      id: AUTH_UID,
      name: "Maria Silva",
      email: "maria@webstart.test",
      ...overrides,
    }),
  );
  fake.setSession({ id: AUTH_UID });
}

beforeEach(async () => {
  vi.resetModules();
  setTz("UTC");
  vi.useFakeTimers();
  vi.setSystemTime(NOON_UTC);
  fake = mockSupabase();
  userService = await loadUserService();
  progressService = await loadProgressService();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

function row() {
  return fake.profileById(AUTH_UID);
}

describe("updateUserStreak — mesmo dia", () => {
  it("não incrementa o streak quando a atividade é no mesmo dia", async () => {
    seedProfile({ streak: 4, xp: 400, last_study_date: D });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(4);
    expect(result.broke).toBe(false);
    expect(result.bonusXp).toBe(0);
    expect(result.penaltyXp).toBe(0);
    expect(row().last_study_date).toBe(D);
  });

  it("duas atividades no mesmo dia devolvem o mesmo streak", async () => {
    seedProfile({ streak: 2, xp: 100, last_study_date: D });

    await userService.updateUserStreak(AUTH_UID);
    const second = await userService.updateUserStreak(AUTH_UID);

    expect(second.streak).toBe(2);
    expect(row().streak).toBe(2);
  });
});

describe("updateUserStreak — dia consecutivo", () => {
  it("incrementa o streak e dá bónus no dia seguinte", async () => {
    seedProfile({ streak: 1, xp: 100, last_study_date: D_MINUS_1 });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(2);
    expect(result.broke).toBe(false);
    expect(result.bonusXp).toBe(10);
    expect(row().streak).toBe(2);
    expect(row().last_study_date).toBe(D);
  });

  it("escala o bónus: 10 XP ao chegar a 2 dias, 20 XP aos 3, 50 XP aos 7", async () => {
    seedProfile({ streak: 1, xp: 100, last_study_date: D_MINUS_1 });
    expect((await userService.updateUserStreak(AUTH_UID)).bonusXp).toBe(10);

    seedProfile({ streak: 2, xp: 100, last_study_date: D_MINUS_1 });
    expect((await userService.updateUserStreak(AUTH_UID)).bonusXp).toBe(20);

    seedProfile({ streak: 6, xp: 100, last_study_date: D_MINUS_1 });
    expect((await userService.updateUserStreak(AUTH_UID)).bonusXp).toBe(50);
  });

  it("meia-noite: 00:05 do dia seguinte ainda conta como dia consecutivo", async () => {
    vi.setSystemTime(at("2026-06-15T00:05:00.000Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D_MINUS_1 });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(4);
    expect(row().last_study_date).toBe("2026-06-15");
  });

  it("23:59 em Luanda continua a contar como o mesmo dia", async () => {
    // 22:59:59.999Z = 23:59:59.999 em Luanda: o último segundo do dia civil.
    vi.setSystemTime(at("2026-06-15T22:59:59.999Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(3);
    expect(result.broke).toBe(false);
    expect(row().last_study_date).toBe(D);
  });

  
    it("23:59 UTC já é o dia seguinte em Luanda", async () => {
    // Mesmo instante, outra leitura: em UTC é 15/06, em Luanda já é 16/06.
    // O produto conta o dia de Luanda, por isso isto é um dia novo — e um
    // streak de 3 que começou em 15/06 é uma sequência legítima.
    vi.setSystemTime(at("2026-06-15T23:59:59.999Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(4);
    expect(result.broke).toBe(false);
    expect(row().last_study_date).toBe("2026-06-16");
  });
});

describe("updateUserStreak — salto de 2+ dias", () => {
  it("um gap de 3 dias reinicia o streak para 1 e penaliza", async () => {
    seedProfile({ streak: 5, xp: 500, last_study_date: D_MINUS_3 });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(1);
    expect(result.broke).toBe(true);
    expect(result.penaltyXp).toBe(10);
    expect(row().streak).toBe(1);
    expect(row().last_study_date).toBe(D);
  });

  it("um gap penaliza mais o streak do que o pequeno", async () => {
    seedProfile({ streak: 2, xp: 200, last_study_date: D_MINUS_3 });
    expect((await userService.updateUserStreak(AUTH_UID)).penaltyXp).toBe(0);

    seedProfile({ streak: 3, xp: 300, last_study_date: D_MINUS_3 });
    expect((await userService.updateUserStreak(AUTH_UID)).penaltyXp).toBe(10);

    seedProfile({ streak: 8, xp: 800, last_study_date: D_MINUS_3 });
    expect((await userService.updateUserStreak(AUTH_UID)).penaltyXp).toBe(25);
  });

  it("reinicia para 1 mesmo que o streak anterior fosse 1 (não volta a 0)", async () => {
    seedProfile({ streak: 1, xp: 50, last_study_date: D_MINUS_3 });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(1);
    expect(row().streak).toBe(1);
  });
});

describe("updateUserStreak — primeira atividade de sempre", () => {
  it("perfil sem last_study_date começa o streak em 1 sem penalizar", async () => {
    seedProfile({ streak: 0, xp: 0, last_study_date: null });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(1);
    expect(result.broke).toBe(false);
    expect(result.penaltyXp).toBe(0);
    expect(row().last_study_date).toBe(D);
  });

  it("não dá bónus de streak na primeira atividade", async () => {
    seedProfile({ streak: 0, xp: 0, last_study_date: null });

    expect((await userService.updateUserStreak(AUTH_UID)).bonusXp).toBe(0);
  });
});

describe("updateUserStreak — XP nunca negativo", () => {
  it("penalidade nunca leva o XP abaixo de zero", async () => {
    seedProfile({ streak: 8, xp: 3, last_study_date: D_MINUS_3 });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.penaltyXp).toBe(25);
    expect(row().xp).toBe(0);
    expect(row().xp).toBeGreaterThanOrEqual(0);
  });

  it("penalidade com XP 0 mantém 0", async () => {
    seedProfile({ streak: 8, xp: 0, last_study_date: D_MINUS_3 });

    await userService.updateUserStreak(AUTH_UID);

    expect(row().xp).toBe(0);
  });
});

describe("o dia civil é o de Luanda, não o do browser", () => {
  // Bug #16. Antes, `getTodayKey()` era `toISOString().split("T")[0]`: em Luanda
  // (UTC+1) quem estudasse às 00:30 era registado no dia ANTERIOR, e voltar a
  // estudar às 20:00 do mesmo dia civil contava como dia seguinte — streak +2
  // numa só noite. Estes testes fixam o contrato novo: o dia é o de Luanda,
  // independentemente do fuso da máquina.
  it("00:30 em Luanda é registado como 15/06, não como 14/06", async () => {
    setTz("Africa/Luanda"); // UTC+1, sem DST
    // 2026-06-14T23:30Z = 2026-06-15T00:30 em Luanda.
    vi.setSystemTime(at("2026-06-14T23:30:00.000Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D_MINUS_1 });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(4);
    expect(row().last_study_date).toBe(D);
  });

  it("o mesmo dia civil não pode contar duas vezes", async () => {
    setTz("Africa/Luanda");
    seedProfile({ streak: 3, xp: 300, last_study_date: D_MINUS_1 });

    // 00:30 de 15/06 -> dia 15/06, streak vai a 4
    vi.setSystemTime(at("2026-06-14T23:30:00.000Z"));
    await userService.updateUserStreak(AUTH_UID);
    expect(row().last_study_date).toBe(D);

    // 20:00 de 15/06 (= 19:00Z) -> o MESMO dia, streak fica em 4
    vi.setSystemTime(at("2026-06-15T19:00:00.000Z"));
    const second = await userService.updateUserStreak(AUTH_UID);

    expect(second.streak).toBe(4);
    expect(second.broke).toBe(false);
    expect(row().last_study_date).toBe(D);
  });

  it("num browser em Cabo Verde o dia continua a ser o de Luanda", async () => {
    setTz("Atlantic/Cape_Verde"); // UTC-1
    // 2026-06-15T23:00Z = 22:00 de 15/06 em Cabo Verde, mas 00:00 de 16/06 em
    // Luanda. O produto conta Luanda, logo é um dia novo — e o browser não
    // tem voto na matéria.
    vi.setSystemTime(at("2026-06-15T23:00:00.000Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D_MINUS_1 });

    const result = await userService.updateUserStreak(AUTH_UID);

    // O browser em Cabo Verde ainda está em 15/06; o produto já passou para 16/06.
    expect(result.streak).toBe(1);
    expect(result.broke).toBe(true);
    expect(row().last_study_date).toBe("2026-06-16");
  });
});

describe("mudança de hora / DST não afecta a contagem", () => {
  it("num salto de DST o dia anterior continua a ser dia consecutivo", async () => {
    // Europa/Lisboa: DST avança a 2026-03-29 às 01:00 UTC (00:00 local). Luanda
    // não tem DST, por isso o produto nem se ressente.
    setTz("Europe/Lisbon");
    vi.setSystemTime(at("2026-03-29T12:00:00.000Z"));
    seedProfile({ streak: 6, xp: 600, last_study_date: "2026-03-28" });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(7);
    expect(result.bonusXp).toBe(50);
    expect(row().last_study_date).toBe("2026-03-29");
  });

  it("num retrocesso de DST o dia anterior ainda conta como dia consecutivo", async () => {
    // Europa/Lisboa: DST recua a 2026-10-25 às 01:00 UTC.
    setTz("Europe/Lisbon");
    vi.setSystemTime(at("2026-10-25T12:00:00.000Z"));
    seedProfile({ streak: 6, xp: 600, last_study_date: "2026-10-24" });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(7);
    expect(result.broke).toBe(false);
  });
});

describe("XP acumulado via completeLesson", () => {
  function seedLessons(count) {
    for (const lesson of [...allLessons, ...allVideoLessons].slice(0, count)) {
      fake.db.lessons.push({
        id: lesson.id,
        course_id: lesson.courseId,
        module_id: lesson.moduleId || null,
      });
    }
  }

  function firstLessons(count) {
    return [...allLessons, ...allVideoLessons].slice(0, count);
  }

  it("acumula XP em várias aulas no mesmo dia", async () => {
    const lessons = firstLessons(3);
    seedLessons(3);
    seedProfile({ xp: 0, level: 1 });

    const first = await progressService.completeLesson(AUTH_UID, lessons[0].id);
    const second = await progressService.completeLesson(AUTH_UID, lessons[1].id);
    const third = await progressService.completeLesson(AUTH_UID, lessons[2].id);

    // 50 XP por aula + bónus de streak na 1.ª do dia.
    expect(first.xpEarned).toBeGreaterThanOrEqual(50);
    expect(row().xp).toBeGreaterThanOrEqual(150);
    expect(second.xpEarned).toBeGreaterThanOrEqual(50);
    expect(third.xpEarned).toBeGreaterThanOrEqual(50);
    expect(row().xp).toBeGreaterThanOrEqual(150);
    expect(row().completed_lessons).toEqual(
      expect.arrayContaining([lessons[0].id, lessons[1].id, lessons[2].id]),
    );
  });

  it("o streak só é incrementado uma vez no mesmo dia", async () => {
    const lessons = firstLessons(3);
    seedLessons(3);
    seedProfile({ xp: 0, level: 1 });

    await progressService.completeLesson(AUTH_UID, lessons[0].id);
    await progressService.completeLesson(AUTH_UID, lessons[1].id);
    await progressService.completeLesson(AUTH_UID, lessons[2].id);

    expect(row().streak).toBe(1);
  });

  it("concluir a mesma aula duas vezes não duplica XP nem aula", async () => {
    const lesson = firstLessons(1)[0];
    seedLessons(1);
    seedProfile({ xp: 0, level: 1 });

    const first = await progressService.completeLesson(AUTH_UID, lesson.id);
    const xpAfterFirst = row().xp;
    const second = await progressService.completeLesson(AUTH_UID, lesson.id);

    expect(second.alreadyCompleted).toBe(true);
    expect(second.xpEarned).toBe(0);
    expect(row().xp).toBe(xpAfterFirst);
    expect(row().completed_lessons.filter((id) => id === lesson.id)).toHaveLength(1);
    expect(first.xpEarned).toBeGreaterThan(0);
  });

  it("XP nunca fica negativo depois de muitos gaps", async () => {
    seedProfile({ xp: 5, level: 1, streak: 9, last_study_date: D_MINUS_3 });

    await userService.updateUserStreak(AUTH_UID);
    await userService.updateUserStreak(AUTH_UID);
    await userService.updateUserStreak(AUTH_UID);

    expect(row().xp).toBeGreaterThanOrEqual(0);
  });
});

describe("getLevelFromXp — duas escalas divergentes", () => {
  it("userService grava o nível pela escala de thresholds; utils/xp.js usa 1000 XP/nível", async () => {
    const utilsXp = await import("../utils/xp.js");

    // A escala efetivamente gravada em profiles.level (userService):
    seedProfile({ xp: 0, level: 1 });
    await userService.addXpToUser(AUTH_UID, 500);
    const storedLevel = row().level;

    // A escala de utils/xp.js, usada como fallback no ProgressContext quando
    // profile.level é falsy. Diverge em quase toda a gama.
    expect(storedLevel).toBe(4);
    expect(utilsXp.getLevelFromXp(500)).toBe(1);
    expect(utilsXp.getLevelFromXp(1500)).toBe(2);
  });
});