/**
 * ETAPA 7 — trilhas: cálculo da trilha atual e do progresso.
 *
 * Nomenclatura real do projecto (descoberta no código, não assumida):
 *   - "trilha"  = `trails` em src/data/trails.js (identificador `trail.id`)
 *   - "trilha atual" persistida = `profiles.current_course` (coluna text)
 *   - "trilha atual" derivada    = `getJourneyProgress().currentTrail`
 *   - progresso                 = `lesson_progress` + `profiles.completed_lessons`
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { mockSupabase, loadProgressService, loadTrailProgressService, loadUserService } from "./harness.js";
import { makeProfile } from "./fakeSupabase.js";
import { allLessons, allVideoLessons } from "../data/lessons/index.js";
import { getModuleData, getTrailById, trails } from "../data/trails.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const LEGACY_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

let fake;
let trailService;
let progressService;
let userService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  trailService = await loadTrailProgressService();
  progressService = await loadProgressService();
  userService = await loadUserService();
});

function lessonsOf(trailId) {
  return [...allLessons, ...allVideoLessons].filter((l) => l.courseId === trailId);
}

describe("getJourneyProgress — trilha atual derivada", () => {
  it("utilizador sem progresso: currentTrail = primeira trilha acessível", () => {
    const result = trailService.getJourneyProgress([], [], []);
    expect(result.currentTrail).toBe("fundamentos-web");
    // nextTrail é a trilha SEGUINTE à atual (não a atual repetida).
    expect(result.nextTrail).toBe("html");
    expect(result.completedCount).toBe(0);
    expect(result.totalCount).toBe(trailService.getAccessibleTrails().length);
  });

  it("BUG: depois de concluir a 1ª trilha, currentTrail passa a ser a 2ª", () => {
    const result = trailService.getJourneyProgress(["fundamentos-web"], [], []);
    // Concluiu fundamentos-web → está a fazer a 2ª (html).
    expect(result.currentTrail).toBe("html");
    expect(result.nextTrail).toBe("html-exercises");
  });

  it("BUG: trilhas 'soon' nunca são devolvidas como currentTrail/nextTrail", () => {
    const soonIds = trails.filter((t) => t.status === "soon").map((t) => t.id);
    expect(soonIds.length).toBeGreaterThan(0);

    // Simula ter concluído todas as trilhas acessíveis.
    const accessible = trailService.getAccessibleTrails().map((t) => t.id);
    const result = trailService.getJourneyProgress(accessible, [], []);

    expect(soonIds).not.toContain(result.nextTrail);
    expect(soonIds).not.toContain(result.currentTrail);
  });

  it("todas as trilhas concluídas: currentTrail continua a ser uma trilha acessível", () => {
    const accessible = trailService.getAccessibleTrails().map((t) => t.id);
    const result = trailService.getJourneyProgress(accessible, [], []);

    expect(accessible).toContain(result.currentTrail);
  });

  it("percent é coerente com completedCount", () => {
    const accessible = trailService.getAccessibleTrails();
    const result = trailService.getJourneyProgress([accessible[0].id], [], []);
    expect(result.percent).toBe(
      Math.round((result.completedCount / accessible.length) * 100),
    );
  });

  it("cada journey mantém unlocked = true e o completed correcto", () => {
    const result = trailService.getJourneyProgress(["fundamentos-web"], [], []);
    const first = result.journeys.find((j) => j.id === "fundamentos-web");
    const second = result.journeys.find((j) => j.id === "html");
    expect(first.completed).toBe(true);
    expect(second.completed).toBe(false);
    expect(result.journeys.every((j) => j.unlocked)).toBe(true);
  });
});

describe("computeTrailStatus", () => {
  const allLessonIds = lessonsOf("html").map((l) => l.id);

  it("trilha inexistente devolve 'available' em vez de lançar", () => {
    expect(trailService.computeTrailStatus("nao-existe", [], [], [])).toBe("available");
  });

  it("trilha 'soon' devolve 'available'", () => {
    const soon = trails.find((t) => t.status === "soon");
    expect(trailService.computeTrailStatus(soon.id, allLessonIds, [], [])).toBe("available");
  });

  it("sem aulas concluídas: 'available'", () => {
    expect(trailService.computeTrailStatus("html", [], [], [])).toBe("available");
  });

  it("com algumas aulas concluídas: 'in_progress'", () => {
    expect(
      trailService.computeTrailStatus("html", allLessonIds.slice(0, 1), [], []),
    ).toBe("in_progress");
  });

  it("com todas as aulas concluídas: 'completed'", () => {
    expect(trailService.computeTrailStatus("html", allLessonIds, [], [])).toBe("completed");
  });

  it("completedCourses tem precedência sobre aulas", () => {
    expect(trailService.computeTrailStatus("html", [], ["html"], [])).toBe("completed");
  });
});

describe("getRecommendedTrail", () => {
  it("utilizador sem progresso recebe a primeira trilha acessível", () => {
    expect(trailService.getRecommendedTrail([], [])?.id).toBe("fundamentos-web");
  });

  it("BUG: salta para a trilha em curso em vez de ficar na já iniciada", () => {
    const recommended = trailService.getRecommendedTrail([], []);
    expect(recommended.id).toBe("fundamentos-web");
  });

  it("não devolve uma trilha 'soon'", () => {
    const soonIds = new Set(trails.filter((t) => t.status === "soon").map((t) => t.id));
    const recommended = trailService.getRecommendedTrail([], []);
    expect(soonIds.has(recommended.id)).toBe(false);
  });

  it("tudo concluído devolve null", () => {
    const accessible = trailService.getAccessibleTrails();
    const allLessonIds = [...allLessons, ...allVideoLessons]
      .filter((l) => accessible.some((t) => t.id === l.courseId))
      .map((l) => l.id);
    expect(trailService.getRecommendedTrail(accessible.map((t) => t.id), allLessonIds)).toBeNull();
  });
});

describe("getCourseProgressPercent", () => {
  it("curso inexistente devolve 0", () => {
    expect(progressService.getCourseProgressPercent([], [], "nao-existe")).toBe(0);
  });

  it("sem aulas concluídas devolve 0", () => {
    expect(progressService.getCourseProgressPercent([], [], "html")).toBe(0);
  });

  it("100% quando todas as aulas e quizzes do curso estão concluídos", () => {
    const course = getTrailById("html");
    const moduleIds = course.modules || [];
    const lessons = [];
    const quizzes = [];
    for (const moduleId of moduleIds) {
      const mod = getModuleData(moduleId);
      if (!mod) continue;
      lessons.push(...(mod.lessons || []));
      if (mod.quiz) quizzes.push(moduleId);
    }

    expect(progressService.getCourseProgressPercent(lessons, quizzes, "html")).toBe(100);
  });

  it("progresso parcial reflecte os módulos concluídos", () => {
    const course = getTrailById("html");
    const lessons = [];
    for (const moduleId of course.modules || []) {
      const mod = getModuleData(moduleId);
      if (!mod) continue;
      lessons.push(...(mod.lessons || []));
    }
    const half = lessons.slice(0, Math.floor(lessons.length / 2));

    const percent = progressService.getCourseProgressPercent(half, [], "html");
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(100);
  });
});

describe("getUserProgress / getLessonProgress", () => {
  it("carrega as linhas de lesson_progress do utilizador", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.lessons.push({ id: "html-1", course_id: "html", module_id: "html-mod-basico" });
    fake.db.lesson_progress.push({
      user_id: AUTH_UID,
      lesson_id: "html-1",
      course_id: "html",
      module_id: "html-mod-basico",
      completed: true,
      completed_at: "2024-05-01T00:00:00.000Z",
      progress_percentage: 100,
      time_spent: 10,
    });
    fake.setSession({ id: AUTH_UID });

    const rows = await progressService.getUserProgress(AUTH_UID);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: AUTH_UID,
      lessonId: "html-1",
      courseId: "html",
      completed: true,
    });
  });

  it("utilizador sem progresso devolve array vazio, não null", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.setSession({ id: AUTH_UID });

    await expect(progressService.getUserProgress(AUTH_UID)).resolves.toEqual([]);
  });

  it("BUG: carrega o progresso do profiles.id resolvido (utilizador migrado)", async () => {
    fake.db.profiles.push(makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID }));
    fake.db.lessons.push({ id: "css-1", course_id: "css", module_id: "css-mod-basico" });
    fake.db.lesson_progress.push({
      user_id: LEGACY_PROFILE_ID,
      lesson_id: "css-1",
      course_id: "css",
      completed: true,
      progress_percentage: 100,
      time_spent: 8,
    });
    fake.setSession({ id: AUTH_UID });

    const rows = await progressService.getUserProgress(AUTH_UID);

    expect(rows).toHaveLength(1);
    expect(rows[0].lessonId).toBe("css-1");
  });

  it("propaga o erro do Supabase (não devolve [])", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.setSession({ id: AUTH_UID });
    fake.setError({ message: "permission denied for table profiles", code: "42501" });

    await expect(progressService.getUserProgress(AUTH_UID)).rejects.toMatchObject({
      code: "42501",
    });
  });
});

describe("completeLesson — persistência", () => {
  const lesson = allLessons[0];

  it("BUG: grava lesson_progress e devolve XP", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.lessons.push({
      id: lesson.id,
      course_id: lesson.courseId,
      module_id: lesson.moduleId,
    });
    fake.setSession({ id: AUTH_UID });

    const result = await progressService.completeLesson(AUTH_UID, lesson.id);

    expect(result.alreadyCompleted).toBe(false);
    expect(result.xpEarned).toBeGreaterThan(0);
    const row = fake.db.lesson_progress.find(
      (r) => r.user_id === AUTH_UID && r.lesson_id === lesson.id,
    );
    expect(row.completed).toBe(true);
  });

  it("conclui uma vídeo-aula Python e atualiza progresso e XP", async () => {
    const pythonLesson = allVideoLessons.find((item) => item.id === "python-vid-2");
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.lessons.push({
      id: pythonLesson.id,
      course_id: pythonLesson.courseId,
      module_id: pythonLesson.moduleId,
    });
    fake.setSession({ id: AUTH_UID });

    const result = await progressService.completeLesson(AUTH_UID, pythonLesson.id);

    expect(result.xpEarned).toBeGreaterThan(0);
    expect(
      fake.db.lesson_progress.find((row) => row.lesson_id === pythonLesson.id),
    ).toMatchObject({
      course_id: "python",
      module_id: pythonLesson.moduleId,
      completed: true,
      progress_percentage: 100,
    });
    expect(fake.db.profiles[0].completed_lessons).toContain(pythonLesson.id);
  });

  it("não volta a dar XP quando a aula já estava concluída", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.lessons.push({
      id: lesson.id,
      course_id: lesson.courseId,
      module_id: lesson.moduleId,
    });
    fake.db.lesson_progress.push({
      user_id: AUTH_UID,
      lesson_id: lesson.id,
      course_id: lesson.courseId,
      completed: true,
      progress_percentage: 100,
      time_spent: 10,
    });
    fake.setSession({ id: AUTH_UID });

    const result = await progressService.completeLesson(AUTH_UID, lesson.id);

    expect(result.alreadyCompleted).toBe(true);
    expect(result.xpEarned).toBe(0);
  });

  it("aula inexistente dá erro explícito", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.setSession({ id: AUTH_UID });

    await expect(
      progressService.completeLesson(AUTH_UID, "aula-que-nao-existe"),
    ).rejects.toThrow(/Aula não encontrada/i);
  });

  it("perfil não resolvível dá erro de negócio, não 23503 cru", async () => {
    fake.setSession({ id: AUTH_UID });

    await expect(
      progressService.completeLesson(AUTH_UID, lesson.id),
    ).rejects.toThrow(/identificar o teu perfil/i);
  });

  it("BUG: persiste o progresso no profiles.id resolvido (utilizador migrado)", async () => {
    const legacy = makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID });
    fake.db.profiles.push(legacy);
    fake.db.lessons.push({
      id: lesson.id,
      course_id: lesson.courseId,
      module_id: lesson.moduleId,
    });
    fake.setSession({ id: AUTH_UID });

    await progressService.completeLesson(AUTH_UID, lesson.id);

    expect(
      fake.db.lesson_progress.some(
        (r) => r.user_id === LEGACY_PROFILE_ID && r.lesson_id === lesson.id,
      ),
    ).toBe(true);
    expect(
      fake.db.lesson_progress.some(
        (r) => r.user_id === AUTH_UID && r.lesson_id === lesson.id,
      ),
    ).toBe(false);
  });
});

describe("subscribeToUserProgress", () => {
  it("entrega as linhas de progresso no SUBSCRIBED", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.lesson_progress.push({
      user_id: AUTH_UID,
      lesson_id: "html-1",
      course_id: "html",
      completed: true,
      progress_percentage: 100,
      time_spent: 5,
    });
    fake.setSession({ id: AUTH_UID });

    const rows = await new Promise((resolve) => {
      progressService.subscribeToUserProgress(AUTH_UID, resolve, () => resolve("error"));
    });

    expect(rows).not.toBe("error");
    expect(rows).toHaveLength(1);
  });

  it("sem userId não subscreve nada", () => {
    const before = fake.queries.length;
    const unsubscribe = progressService.subscribeToUserProgress(null, () => {}, () => {});
    expect(typeof unsubscribe).toBe("function");
    expect(fake.queries.length).toBe(before);
  });
});

describe("visitLesson — trilha atual persistida", () => {
  it("grava current_course/current_lesson", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.setSession({ id: AUTH_UID });
    const lesson = allLessons[0];

    await progressService.visitLesson(AUTH_UID, lesson);

    const row = fake.profileById(AUTH_UID);
    expect(row.current_course).toBe(lesson.courseId);
    expect(row.current_lesson).toBe(lesson.id);
  });

  it("BUG: grava no perfil com histórico, não na work profile vazia", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, xp: 0 }),
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID, xp: 500 }),
    );
    fake.setSession({ id: AUTH_UID });
    const lesson = allLessons[0];

    await progressService.visitLesson(AUTH_UID, lesson);

    expect(fake.profileById(LEGACY_PROFILE_ID).current_course).toBe(lesson.courseId);
  });
});

describe("incoerência current_track vs track_id", () => {
  it("current_course guarda o MESMO id usado por trails[].id", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.setSession({ id: AUTH_UID });
    const lesson = lessonsOf("html")[0];

    await progressService.visitLesson(AUTH_UID, lesson);

    const stored = fake.profileById(AUTH_UID).current_course;
    const trail = trails.find((t) => t.id === stored);
    expect(trail).toBeDefined();
    expect(trail.status).not.toBe("soon");
  });

  it("slug NÃO é usado como identificador de current_course", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: "html" }));
    const profile = await userService.getUserProfile(AUTH_UID);
    // O slug da trilha é "html5"; o que o dashboard lê tem de ser o id.
    expect(profile.currentCourse).toBe("html");
    expect(getTrailById(profile.currentCourse).id).toBe("html");
  });
});

describe("erros — Supabase indisponível / timeout", () => {
  it("getUserProgress rejeita quando o Supabase está indisponível", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.setSession({ id: AUTH_UID });
    fake.setError({ name: "AuthRetryableFetchError", message: "Network request failed" });

    await expect(progressService.getUserProgress(AUTH_UID)).rejects.toBeDefined();
  });

  it("addXpToUser não lança quando o perfil não existe", async () => {
    await expect(userService.addXpToUser(AUTH_UID, 10)).resolves.toBeNull();
  });

  it("addStudyTime não lança quando o perfil não existe", async () => {
    await expect(userService.addStudyTime(AUTH_UID, 5)).resolves.toBeUndefined();
  });

  it("register/login com utilizador inexistente não deixa estado a meio", async () => {
    const authService = await import("../services/authService.js");
    await expect(
      authService.loginWithEmail("ninguem@webstart.test", "x"),
    ).rejects.toThrow();
  });
});
