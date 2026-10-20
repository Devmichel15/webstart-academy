/**
 * FASE 2 — regressões do painel admin (bugs #16 a #20).
 *
 * Nomenclatura real do projecto (descoberta no código, não assumida):
 *   - total de utilizadores = `getAllUsers()` → linhas de `public.profiles`
 *   - "novos hoje"            = `computeDashboardMetrics()` → `created_at`
 *   - "trilha atual" (UI)     = `AdminUsers.jsx` → `user.currentCourse`
 *
 * Estes testes existem porque o painel admin tem o SEU próprio `mapProfileRow`
 * (`adminService.js`), separado do `mapProfileRow` do `userService`. Divergiram.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { mockSupabase } from "./harness.js";
import { makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const LEGACY_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

let fake;
let adminService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  adminService = await import("../services/adminService.js");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

/**
 * Fixa o TZ do *processo* (o "browser do admin") e o instante atual.
 * O bug é precisamente o resultado depender do TZ de quem abre o painel.
 */
function atNow(iso, processTz = "UTC") {
  vi.stubEnv("TZ", processTz);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe("BUG #16: 'novos hoje' depende do fuso do browser de quem olha", () => {
  // 2026-10-01 10:00 em Luanda = 2026-10-01 09:00Z
  const NOW_LUANDA_MORNING = "2026-10-01T09:00:00.000Z";

  it("utilizador registado às 00:30 em Luanda conta como 'hoje' mesmo com o admin em UTC", () => {
    // 00:30 de 1 de Outubro em Luanda (UTC+1) = 30 de Setembro às 23:30Z.
    atNow(NOW_LUANDA_MORNING, "UTC");

    const metrics = adminService.computeDashboardMetrics(
      [{ id: AUTH_UID, createdAt: "2026-09-30T23:30:00.793058+00:00", completedLessons: [], completedCourses: [] }],
      [],
    );

    expect(metrics.newToday).toBe(1);
  });

  it("interpreta o timestamp Postgres com microssegundos e offset sem perder o dia civil", () => {
    atNow("2026-10-05T20:30:00.000Z", "UTC");

    const metrics = adminService.computeDashboardMetrics(
      [{ id: AUTH_UID, createdAt: "2026-10-05T20:25:10.793058+00:00" }],
      [],
    );

    expect(metrics.newToday).toBe(1);
    expect(metrics.newThisWeek).toBe(1);
  });

  it("mesmo registo conta como 'hoje' com o admin em Luanda (resultado independente do browser)", () => {
    atNow(NOW_LUANDA_MORNING, "Africa/Luanda");

    const metrics = adminService.computeDashboardMetrics(
      [{ id: AUTH_UID, createdAt: "2026-09-30T23:30:00.000Z", completedLessons: [], completedCourses: [] }],
      [],
    );

    expect(metrics.newToday).toBe(1);
  });

  it("registo das 23:30 de Luanda do dia anterior NÃO conta como hoje", () => {
    // 2026-09-30 23:30 em Luanda = 22:30Z de 30 de Setembro.
    atNow(NOW_LUANDA_MORNING, "Africa/Luanda");

    const metrics = adminService.computeDashboardMetrics(
      [{ id: AUTH_UID, createdAt: "2026-09-30T22:30:00.000Z", completedLessons: [], completedCourses: [] }],
      [],
    );

    expect(metrics.newToday).toBe(0);
  });

  it("usa segunda-feira como início da semana e exclui o instante atual", () => {
    // Segunda-feira 00:30 em Luanda. A semana começa às 23:00Z de domingo.
    atNow("2026-10-04T23:30:00.000Z", "UTC");

    const metrics = adminService.computeDashboardMetrics(
      [
        { id: "sunday-profile", createdAt: "2026-10-04T22:59:59.999999+00:00" },
        { id: "monday-profile", createdAt: "2026-10-04T23:00:00.000000+00:00" },
        { id: "now-profile", createdAt: "2026-10-04T23:30:00.000000+00:00" },
      ],
      [],
    );

    expect(metrics.newToday).toBe(1);
    expect(metrics.newThisWeek).toBe(1);
  });
});

describe("BUG #17: created_at nulo é saltado em silêncio", () => {
  it("avisa sobre created_at ausente/inválido e não os conta como novos", () => {
    atNow("2026-10-01T09:00:00.000Z", "Africa/Luanda");

    const metrics = adminService.computeDashboardMetrics(
      [
        { id: AUTH_UID, createdAt: null, completedLessons: [], completedCourses: [] },
        { id: "33333333-3333-4333-8333-333333333333", createdAt: "not-a-date", completedLessons: [], completedCourses: [] },
      ],
      [],
    );

    expect(metrics.newToday).toBe(0);
    expect(metrics.usersWithUnknownCreatedAt).toBe(2);
    expect(console.warn).toHaveBeenCalledWith(
      "[adminService] Invalid or missing created_at for profile:",
      AUTH_UID,
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[adminService] Invalid or missing created_at for profile:",
      "33333333-3333-4333-8333-333333333333",
    );
  });
});

describe("BUG #18: total e novos utilizadores contam linhas de profiles", () => {
  it("utilizador migrado com 2 linhas em profiles conta ambas as linhas", () => {
    atNow("2026-10-01T09:00:00.000Z", "UTC");
    const metrics = adminService.computeDashboardMetrics(
      [
        {
          id: AUTH_UID,
          authUserId: AUTH_UID,
          createdAt: "2026-09-30T23:30:00.000Z",
          completedLessons: [],
          completedCourses: [],
        },
        {
          id: LEGACY_PROFILE_ID,
          authUserId: AUTH_UID,
          createdAt: "2026-09-30T23:35:00.000Z",
          completedLessons: ["html-1"],
          completedCourses: ["html"],
        },
      ],
      [],
    );

    expect(metrics.totalUsers).toBe(2);
    expect(metrics.newToday).toBe(2);
    expect(metrics.newThisWeek).toBe(2);
    expect(metrics.duplicateProfileRows).toBe(1);
  });

  it("perfis sem auth_user_id (não migrados) continuam a contar 1 cada", () => {
    const metrics = adminService.computeDashboardMetrics(
      [
        { id: AUTH_UID, authUserId: null, createdAt: "2026-09-30T23:30:00.000Z", completedLessons: [], completedCourses: [] },
        { id: LEGACY_PROFILE_ID, authUserId: null, createdAt: "2026-09-30T22:00:00.000Z", completedLessons: [], completedCourses: [] },
      ],
      [],
    );

    expect(metrics.totalUsers).toBe(2);
    expect(metrics.duplicateProfileRows).toBe(0);
  });
});

describe("BUG #19: mapProfileRow do admin não mapeia current_course", () => {
  it("getAllUsers expõe currentCourse (AdminUsers.jsx lê user.currentCourse)", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: "html" }));

    const users = await adminService.getAllUsers();

    expect(users).toHaveLength(1);
    expect(users[0].currentCourse).toBe("html");
  });

  it("perfil sem current_course devolve null, não undefined", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: null }));

    const users = await adminService.getAllUsers();

    expect(users[0].currentCourse).toBeNull();
  });

  it("expõe também o nome e os links, para o painel não divergir do perfil público", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, name: "Maria Silva", bio: "ola", github_url: "https://github.com/maria" }),
    );

    const users = await adminService.getAllUsers();

    expect(users[0].name).toBe("Maria Silva");
    expect(users[0].bio).toBe("ola");
    expect(users[0].githubUrl).toBe("https://github.com/maria");
  });
});

describe("BUG #20: current_course tem prioridade; fallback usa lesson_progress em lote", () => {
  const foundationLessonIds = Array.from({ length: 14 }, (_, index) => `logica-vid-${index + 1}`);

  it("deriva a trilha seguinte a partir do progresso carregado em lote", () => {
    const user = {
      id: LEGACY_PROFILE_ID,
      authUserId: AUTH_UID,
      currentCourse: null,
      completedCourses: [],
    };
    const progressRecords = foundationLessonIds.map((lessonId) => ({
      userId: AUTH_UID,
      lessonId,
      completed: true,
    }));

    expect(adminService.getUserTrailForRow(user, progressRecords)).toBe("html");
  });

  it("um current_course válido tem prioridade sobre o progresso", () => {
    expect(
      adminService.getUserTrailForRow(
        { id: AUTH_UID, currentCourse: "css", completedCourses: ["fundamentos-web"] },
        [],
      ),
    ).toBe("css");
  });

  it("não confunde progresso de outra pessoa com o utilizador da linha", () => {
    const user = { id: LEGACY_PROFILE_ID, currentCourse: null, completedCourses: [] };
    const progressRecords = foundationLessonIds.map((lessonId) => ({
      userId: AUTH_UID,
      lessonId,
      completed: true,
    }));

    expect(adminService.getUserTrailForRow(user, progressRecords)).toBeNull();
  });

  it("usa a trilha atual persistida como a mais recente quando há progresso em várias trilhas", () => {
    const progressRecords = foundationLessonIds.map((lessonId) => ({
      userId: AUTH_UID,
      lessonId,
      completed: true,
    }));

    expect(
      adminService.getUserTrailForRow(
        {
          id: AUTH_UID,
          currentCourse: "python",
          completedCourses: ["fundamentos-web", "html"],
        },
        progressRecords,
      ),
    ).toBe("python");
  });

  it("ignora current_course inválido e usa progresso; sem qualquer progresso devolve null", () => {
    const user = { id: AUTH_UID, currentCourse: "not-a-trail", completedCourses: [] };
    const progressRecords = foundationLessonIds.map((lessonId) => ({
      userId: AUTH_UID,
      lessonId,
      completed: true,
    }));

    expect(adminService.getUserTrailForRow(user, progressRecords)).toBe("html");
    expect(adminService.getUserTrailForRow({ ...user, currentCourse: null }, [])).toBeNull();
  });

  it("não inventa uma trilha quando todo o progresso aponta para aulas removidas", () => {
    const user = {
      id: AUTH_UID,
      currentCourse: null,
      completedCourses: [],
      completedLessons: ["lesson-removed-from-catalog"],
    };
    const progressRecords = [{
      userId: AUTH_UID,
      lessonId: "lesson-removed-from-catalog",
      completed: true,
    }];

    expect(adminService.getUserTrailForRow(user, progressRecords)).toBeNull();
  });

  it("ignora códigos de curso removidos do catálogo", () => {
    expect(
      adminService.getUserTrailForRow(
        { id: AUTH_UID, currentCourse: "trail-removed", completedCourses: ["trail-removed"] },
        [],
      ),
    ).toBeNull();
  });
});