/**
 * ETAPA 5 — userService: carregamento de utilizador, nome e trilha atual.
 *
 * Modelo real (supabase/migrations/001_initial_schema.sql + 009 + 011):
 *   auth.users.id  ──(profiles.id)──────────────────────────►  profiles.id
 *                 ──(profiles.auth_user_id,只用 em perfis re-linkados)►
 *   profiles.current_course  = "current track" (text, id da trail em data/trails.js)
 *
 * Os dois caminhos são legítimos e, para utilizadores migrados do Firebase,
 * coexistem DUAS linhas em `profiles` para o mesmo auth user:
 *   - a "work profile" (id = auth.users.id)
 *   - o "legacy profile" (auth_user_id = auth.users.id)
 * Ver supabase/migrations/011_fix_link_username_collision.sql.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { mockSupabase, loadUserService } from "./harness.js";
import { learningProfileRow, makeAuthUser, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const LEGACY_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

let fake;
let userService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  userService = await loadUserService();
});

describe("getUserProfile — caso normal", () => {
  it("devolve id, name, email e currentCourse (trilha atual) do perfil", async () => {
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        name: "Maria Silva",
        email: "maria@webstart.test",
        current_course: "html",
        current_lesson: "html-intro-1",
        xp: 320,
        level: 3,
        username: "mariasilva",
      }),
    );

    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile).toMatchObject({
      id: AUTH_UID,
      name: "Maria Silva",
      username: "mariasilva",
      email: "maria@webstart.test",
      currentCourse: "html",
      currentLesson: "html-intro-1",
      xp: 320,
      level: 3,
    });
  });

  it("mapeia as colunas JSONB de progresso a partir das colunas snake_case", async () => {
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        completed_lessons: ["html-intro-1", "html-intro-2"],
        completed_courses: ["html"],
        completed_quizzes: ["html-mod-basico"],
        first_steps_done: true,
        is_public: false,
        photo_url: "https://cdn.test/maria.png",
        total_study_time: 145,
      }),
    );

    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile.completedLessons).toEqual(["html-intro-1", "html-intro-2"]);
    expect(profile.completedCourses).toEqual(["html"]);
    expect(profile.completedQuizzes).toEqual(["html-mod-basico"]);
    expect(profile.firstStepsDone).toBe(true);
    expect(profile.isPublic).toBe(false);
    expect(profile.photoURL).toBe("https://cdn.test/maria.png");
    expect(profile.studyHoursHint ?? profile.totalStudyTime).toBe(145);
  });

  it("devolve o perfil ligado por auth_user_id quando id = auth.users.id", async () => {
    fake.db.profiles.push(
      makeProfile({
        id: LEGACY_PROFILE_ID,
        auth_user_id: AUTH_UID,
        legacy_firebase_uid: "firebase-uid-1",
        name: "Utilizador Re-linkado",
        current_course: "css",
      }),
    );

    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile.id).toBe(LEGACY_PROFILE_ID);
    expect(profile.name).toBe("Utilizador Re-linkado");
    expect(profile.currentCourse).toBe("css");
  });
});

describe("getUserProfile — nome", () => {
  it("não transforma um utilizador válido em utilizador sem nome", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, name: "João Portuguese" }));

    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile.name).toBe("João Portuguese");
  });

  it("preserva name = null vindo do banco em vez de mascarar com string vazia", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, name: null }));

    const profile = await userService.getUserProfile(AUTH_UID);

    // O valor real é null; o código não pode inventar um nome aqui.
    expect(profile.name).toBeNull();
  });

  it("devolve null quando o perfil não existe (não inventa um objeto)", async () => {
    const profile = await userService.getUserProfile(AUTH_UID);
    expect(profile).toBeNull();
  });
});

describe("getUserProfile — current track", () => {
  it("utilizador sem trilha devolve currentCourse = null, não undefined", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: null }));

    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile.currentCourse).toBeNull();
  });

  it("preserva a trilha atual tal como está guardada (id da trail)", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: "javascript" }));

    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile.currentCourse).toBe("javascript");
  });
});

describe("getUserProfile — estados de erro", () => {
  it("propaga o erro em vez de devolver null (bug #11)", async () => {
    fake.injectError({ message: "boom", code: "XX000", details: "db down" });

    // `null` significa "perfil inexistente". Confundir os dois fazia
    // createUserProfile inserir um perfil duplicado e o ProgressContext tratar
    // o utilizador como novo.
    await expect(userService.getUserProfile(AUTH_UID)).rejects.toMatchObject({ code: "XX000" });
  });

  it("não engole silenciosamente o erro: regista-o em console.error", async () => {
    fake.injectError({ message: "relation \"profiles\" does not exist", code: "42P01" });

    await expect(userService.getUserProfile(AUTH_UID)).rejects.toMatchObject({
      code: "42P01",
    });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(`[getUserProfile] error for uid ${AUTH_UID}`),
      expect.objectContaining({ code: "42P01" }),
    );
  });

  it("devolve null (e não lança) quando o perfil realmente não existe", async () => {
    fake.db.profiles.length = 0;

    await expect(userService.getUserProfile(AUTH_UID)).resolves.toBeNull();
  });
});

describe("getUserProfile — perfis re-linkados (work profile + legacy profile)", () => {
  /**
   * Estado real criado pela própria aplicação: depois do primeiro login de um
   * utilizador migrado, `link_legacy_profile` cria a work profile (id = auth uid)
   * e marca a legacy profile com auth_user_id = auth uid. A partir daí, o filtro
   * `.or("id.eq.<uid>,auth_user_id.eq.<uid>")` casa com DUAS linhas e
   * `maybeSingle()` devolve erro (PostgREST exige exactamente 1 linha).
   */
  beforeEach(() => {
    fake.db.profiles.push(
      makeProfile({
        id: AUTH_UID,
        legacy_firebase_uid: null,
        auth_user_id: null,
        name: "Trabalho Vazio",
        xp: 0,
        completed_lessons: [],
        completed_courses: [],
      }),
      makeProfile({
        id: LEGACY_PROFILE_ID,
        legacy_firebase_uid: "firebase-uid-1",
        auth_user_id: AUTH_UID,
        name: "Maria Silva",
        xp: 800,
        level: 4,
        current_course: "css",
        completed_lessons: ["css-1"],
      }),
    );
  });

  it("BUG: devolve o perfil em vez de null quando as duas linhas existem", async () => {
    const profile = await userService.getUserProfile(AUTH_UID);

    expect(profile).not.toBeNull();
    expect(profile.name).toBe("Maria Silva");
    expect(profile.currentCourse).toBe("css");
  });

  it("BUG: escolhe de forma determinística o perfil com histórico, não a work profile vazia", async () => {
    const profile = await userService.getUserProfile(AUTH_UID);

    // A work profile (id = auth uid) está vazia: xp 0, sem aulas. A legacy tem
    // o histórico. Escolher a work profile apaga o progresso visível do aluno.
    expect(profile.xp).toBe(800);
    expect(profile.completedLessons).toEqual(["css-1"]);
  });
});

describe("getUserProfileRow / resolveProfileId", () => {
  it("resolveProfileId devolve o profiles.id real do utilizador migrado", async () => {
    fake.db.profiles.push(
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID, xp: 42 }),
    );

    await expect(userService.resolveProfileId(AUTH_UID)).resolves.toBe(LEGACY_PROFILE_ID);
  });

  it("BUG: resolveProfileId não devolve o auth uid quando não existe perfil", async () => {
    // Nunca devolver um uid que não exista em profiles.id, senão as FK
    // user_id → profiles.id falham com 23503 (ver comentário no código).
    await expect(userService.resolveProfileId(AUTH_UID)).resolves.toBeNull();
  });

  it("BUG: resolveProfileId não lança quando existem duas linhas de perfil", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, auth_user_id: null }),
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID }),
    );

    await expect(userService.resolveProfileId(AUTH_UID)).resolves.toBeTypeOf("string");
  });
});

describe("updateUserProfile", () => {
  // Sem sessão, `auth.uid()` é null e o RLS do double rejeita a escrita:
  // em produção o utilizador está autenticado. Autenticamos para que o RLS
  // se comporte como em produção.
  beforeEach(() => {
    fake.setSession({ id: AUTH_UID });
  });
  it("persiste a alteração na linha do profiles.id resolvido", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, first_steps_done: false }));

    await userService.updateUserProfile(AUTH_UID, { firstStepsDone: true, name: "Maria N." });

    const row = fake.profileById(AUTH_UID);
    expect(row.first_steps_done).toBe(true);
    expect(row.name).toBe("Maria N.");
  });

  it("BUG: persiste pela work profile, não pela linha que tem o histórico", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, first_steps_done: false }),
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID, first_steps_done: false }),
    );

    await userService.updateUserProfile(AUTH_UID, { firstStepsDone: true });

    expect(fake.profileById(LEGACY_PROFILE_ID).first_steps_done).toBe(true);
  });

  it("lança erro explícito quando o perfil não existe", async () => {
    await expect(
      userService.updateUserProfile(AUTH_UID, { firstStepsDone: true }),
    ).rejects.toThrow(/perfil do utilizador não encontrado/i);
  });

  it("propaga o erro do Supabase em vez de o engolir", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.injectError({ message: "permission denied for table profiles", code: "42501" });

    await expect(
      userService.updateUserProfile(AUTH_UID, { firstStepsDone: true }),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("updateCurrentLesson", () => {
  beforeEach(() => {
    fake.setSession({ id: AUTH_UID });
  });
  it("grava current_course/current_lesson na linha do perfil", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: null, current_lesson: null }));

    await userService.updateCurrentLesson(AUTH_UID, {
      courseId: "css",
      lessonId: "css-mod-basico-1",
    });

    const row = fake.profileById(AUTH_UID);
    expect(row.current_course).toBe("css");
    expect(row.current_lesson).toBe("css-mod-basico-1");
  });

  it("BUG: grava na work profile vazia em vez do perfil com histórico", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, current_course: null, current_lesson: null }),
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID, current_course: "html", current_lesson: "html-1" }),
    );

    await userService.updateCurrentLesson(AUTH_UID, { courseId: "css", lessonId: "css-1" });

    expect(fake.profileById(LEGACY_PROFILE_ID).current_course).toBe("css");
    expect(fake.profileById(LEGACY_PROFILE_ID).current_lesson).toBe("css-1");
  });
});

describe("createUserProfile", () => {
  it("cria o perfil para uma conta nova, usando o auth uid como profiles.id", async () => {
    const authUser = makeAuthUser({
      id: AUTH_UID,
      email: "novo@webstart.test",
      name: "Novo Aluno",
    });
    fake.authUsers.push(authUser);
    fake.setSession({ ...authUser, password: undefined });

    const profile = await userService.createUserProfile(authUser, { provider: "email" });

    expect(profile.id).toBe(AUTH_UID);
    expect(profile.name).toBe("Novo Aluno");
    expect(fake.profileById(AUTH_UID)).not.toBeNull();
    expect(fake.profileById(AUTH_UID).role).toBe("student");
  });

  it("preenche first_steps_done = false no perfil novo", async () => {
    const authUser = makeAuthUser({ id: AUTH_UID, email: "novo2@webstart.test", name: "X" });
    fake.authUsers.push(authUser);

    const profile = await userService.createUserProfile(authUser);

    expect(profile.first_steps_done).toBe(false);
  });

  it("BUG: devolve o perfil do utilizador migrado no segundo login em vez de falhar", async () => {
    const authUser = makeAuthUser({
      id: AUTH_UID,
      email: "migrada@webstart.test",
      name: "Maria Silva",
    });
    authUser.user_metadata.legacy_firebase_uid = "firebase-uid-1";
    fake.authUsers.push(authUser);

    // Estado pós-primeiro-login: work profile + legacy profile ligada.
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, auth_user_id: null, xp: 0, completed_lessons: [] }),
      makeProfile({
        id: LEGACY_PROFILE_ID,
        auth_user_id: AUTH_UID,
        legacy_firebase_uid: "firebase-uid-1",
        name: "Maria Silva",
        email: "migrada@webstart.test",
        xp: 800,
        current_course: "css",
      }),
    );

    const profile = await userService.createUserProfile(authUser, { provider: "email" });

    expect(profile).not.toBeNull();
    expect(profile.name).toBe("Maria Silva");
  });
});

describe("subscribeToUser", () => {
  it("entrega o perfil mapeado logo após o SUBSCRIBED", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, name: "Maria Silva", current_course: "html" }));
    fake.setSession({ id: AUTH_UID });

    const received = await new Promise((resolve) => {
      const unsubscribe = userService.subscribeToUser(AUTH_UID, resolve);
      expect(typeof unsubscribe).toBe("function");
    });

    expect(received.name).toBe("Maria Silva");
    expect(received.currentCourse).toBe("html");
  });

  it("BUG: propaga o erro do Supabase em vez de entregar profile = null", async () => {
    fake.setSession({ id: AUTH_UID });

    const error = await new Promise((resolve) => {
      userService.subscribeToUser(AUTH_UID, () => resolve("data"), resolve);
    });

    expect(error).toBeTypeOf("string");
  });

  it("sem uid devolve uma função de unsubscribe e não faz queries", async () => {
    const before = fake.queries.length;
    const unsubscribe = userService.subscribeToUser(null, () => {});
    expect(typeof unsubscribe).toBe("function");
    expect(fake.queries.length).toBe(before);
  });
});

describe("XP / streak / contadores", () => {
  it("addXpToUser soma XP e recalcula o nível", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, xp: 10, level: 1 }));

    const result = await userService.addXpToUser(AUTH_UID, 90);

    expect(result).toEqual({ xp: 100, level: 2 });
    expect(fake.profileById(AUTH_UID).xp).toBe(100);
  });

  it("addXpToUser devolve null quando não há perfil", async () => {
    await expect(userService.addXpToUser(AUTH_UID, 10)).resolves.toBeNull();
  });

  it("addCompletedLesson não duplica aulas", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, completed_lessons: ["html-1"] }),
    );

    await userService.addCompletedLesson(AUTH_UID, "html-1");

    expect(fake.profileById(AUTH_UID).completed_lessons).toEqual(["html-1"]);
  });

  it("addCompletedLesson adiciona a aula e devolve a lista atualizada", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, completed_lessons: ["html-1"] }));

    const result = await userService.addCompletedLesson(AUTH_UID, "html-2");

    expect(result).toEqual(["html-1", "html-2"]);
    expect(fake.profileById(AUTH_UID).completed_lessons).toEqual(["html-1", "html-2"]);
  });
});

describe("learning_profiles não é lido por userService", () => {
  it("o perfil de aprendizagem é uma tabela separada, ligada por profiles.id", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.learning_profiles.push(learningProfileRow(AUTH_UID));

    const profile = await userService.getUserProfile(AUTH_UID);

    // getUserProfile não deve arrastar assessment/roadmap para o perfil.
    expect(profile.assessment).toBeUndefined();
    expect(profile.roadmap).toBeUndefined();
  });
});
