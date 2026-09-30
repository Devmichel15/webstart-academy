/**
 * Tarefa 2 — Streak e XP com datas-limite.
 *
 * Nenhum teste toca na data real: `vi.useFakeTimers()` + `vi.setSystemTime()`
 * fixam o "agora" e o TZ do processo, para que os limites de meia-noite,
 * virada de dia e DST sejam determinísticos.
 *
 * Convenção: `D` = 2026-06-15 (UTC). Todas as expectativas são escritas em
 * termos de dias-calendário *do utilizador*, não de UTC — ver os testes
 * marcados "BUG" para o caso em que o código discorda.
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

/** Sets the process timezone so Date's local calendar is deterministic. */
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

  it("23:59 continua a contar como o mesmo dia", async () => {
    vi.setSystemTime(at("2026-06-15T23:59:59.999Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(3);
    expect(result.broke).toBe(false);
    expect(row().last_study_date).toBe(D);
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

describe("BUG: a chave do dia é derivada de UTC, não do calendário local", () => {
  // Documenta o comportamento ACTUAL (o teste passa). O contrato desejado
  // seria "o dia do utilizador"; está registado como bug no relatório.
  //
  // Em Luanda (UTC+1), 2026-06-15T00:30 local = 2026-06-14T23:30Z. O código
  // grava last_study_date = "2026-06-14", ou seja, o dia ANTERIOR ao que o
  // utilizador vive. Consequência: o utilizador estuda à 00:30 e o sistema
  // conta como "ontem"; se voltar a estudar às 20:00 do mesmo dia local, o
  // sistema acha que é "dia seguinte" e aumenta o streak duas vezes no mesmo
  // dia civil.
  it("00:30 em UTC+1 (Luanda) é registado como o dia UTC anterior", async () => {
    setTz("Africa/Luanda"); // UTC+1, sem DST
    // 2026-06-15T01:30Z = 2026-06-15T02:30 local. Para obter 00:30 local
    // (= 2026-06-14T23:30Z) fixamos esse instante.
    vi.setSystemTime(at("2026-06-14T23:30:00.000Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: "2026-06-13" });

    const result = await userService.updateUserStreak(AUTH_UID);

    expect(result.streak).toBe(4);
    // A chave gravada é a data UTC, não a data local do utilizador.
    expect(row().last_study_date).toBe("2026-06-14");
  });

  it("o mesmo dia local pode ser contado duas vezes como dias distintos", async () => {
    setTz("Africa/Luanda");
    seedProfile({ streak: 3, xp: 300, last_study_date: "2026-06-13" });

    // 00:30 local de 15/06 -> chave UTC 14/06, streak vai a 4
    vi.setSystemTime(at("2026-06-14T23:30:00.000Z"));
    await userService.updateUserStreak(AUTH_UID);
    expect(row().last_study_date).toBe("2026-06-14");

    // 20:00 local de 15/06 (= 19:00Z) -> chave UTC 15/06, streak vai a 5
    vi.setSystemTime(at("2026-06-15T19:00:00.000Z"));
    const second = await userService.updateUserStreak(AUTH_UID);

    // Duas atividades no MESMO dia civil do utilizador, streak +2.
    expect(second.streak).toBe(5);
    expect(second.broke).toBe(false);
  });

  it("UTC-1 (Cabo Verde): à noite a chave já é o dia seguinte", async () => {
    setTz("Atlantic/Cape_Verde"); // UTC-1
    // 2026-06-15T22:00 local de 14/06 = 23:00Z de 15/06
    vi.setSystemTime(at("2026-06-15T23:00:00.000Z"));
    seedProfile({ streak: 3, xp: 300, last_study_date: D_MINUS_1 });

    const result = await userService.updateUserStreak(AUTH_UID);

    // O utilizador acha que é 14/06 (ontem); o sistema achou que era 15/06.
    expect(result.streak).toBe(4);
    expect(row().last_study_date).toBe(D);
  });
});

describe("BUG: mudança de hora / DST não é considerada", () => {
  it("num salto de DST o diff de dias continua a ser comparado por string", async () => {
    // Europa/Lisboa: DST avança a 2026-03-29 às 01:00 UTC (00:00 local).
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