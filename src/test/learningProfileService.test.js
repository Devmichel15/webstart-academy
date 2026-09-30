/**
 * ETAPA 6 — onboarding (avaliação de perfil) e a sua persistência.
 *
 * Onboarding pós-login = `learning_profiles`:
 *   - `isAssessmentCompleted(uid)`  → metadata.completed
 *   - `saveFullLearningProfile(uid)` → upsert {assessment, roadmap, metadata}
 *
 * `learning_profiles.user_id` é FK para `profiles(id)` (migration 001). Para
 * utilizadores migrados do Firebase, `profiles.id` NÃO é igual a
 * `auth.users.id` (migration 011) — daí `resolveProfileId` existir no
 * userService e ser usado pelo progressService.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { mockSupabase, loadLearningProfileService } from "./harness.js";
import { learningProfileRow, makeAuthUser, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const LEGACY_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

const ASSESSMENT = {
  experience: "zero",
  objective: "first-job",
  interest: "frontend",
  studyTime: "5-10",
  difficulty: "logic",
  confidence: "low",
  motivation: "career-change",
};

const ROADMAP = {
  recommendedCourses: ["html", "css"],
  estimatedWeeks: 6,
  firstStep: { lessonId: "html-mod-basico-1", courseId: "html" },
};

let fake;
let service;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  service = await loadLearningProfileService();
});

describe("getLearningProfile", () => {
  it("devolve id/assessment/roadmap/metadata quando o onboarding já existe", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { assessment: ASSESSMENT, roadmap: ROADMAP }),
    );

    const profile = await service.getLearningProfile(AUTH_UID);

    expect(profile).toMatchObject({
      id: AUTH_UID,
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });
    expect(profile.metadata.completed).toBe(true);
  });

  it("devolve null quando ainda não há onboarding (utilizador novo)", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));

    await expect(service.getLearningProfile(AUTH_UID)).resolves.toBeNull();
  });

  it("devolve null sem fazer query quando não há uid", async () => {
    await expect(service.getLearningProfile(null)).resolves.toBeNull();
    expect(fake.queries).toHaveLength(0);
  });
});

describe("isAssessmentCompleted", () => {
  it("Cenário 1 — utilizador novo: onboarding NÃO está concluído", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));

    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(false);
  });

  it("Cenário 3 — onboarding concluído: devolve true", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.db.learning_profiles.push(learningProfileRow(AUTH_UID));

    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(true);
  });

  it("devolve false sem uid, sem tocar na base de dados", async () => {
    await expect(service.isAssessmentCompleted(undefined)).resolves.toBe(false);
    expect(fake.queries).toHaveLength(0);
  });

  it("devolve false (e não lança) quando o Supabase está indisponível", async () => {
    // Outage persistente: com `injectError` (uma só falha) o `withRetry`
    // recuperava na segunda tentativa e o erro nunca chegava ao `catch`.
    fake.setError({ message: "Failed to fetch", name: "TypeError" });

    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[learningProfileService]"),
      expect.anything(),
    );
  });

  it("BUG (Cenário 5): utilizador migrado mantém o onboarding concluído após novo login", async () => {
    // Estado real: o onboarding foi guardado com o profiles.id resolvido
    // (LEGACY_PROFILE_ID), não com o auth uid.
    fake.db.profiles.push(
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID, name: "Maria Silva" }),
    );
    fake.db.learning_profiles.push(
      learningProfileRow(LEGACY_PROFILE_ID, { assessment: ASSESSMENT, roadmap: ROADMAP }),
    );
    fake.setSession({ id: AUTH_UID });

    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(true);
  });
});

describe("saveFullLearningProfile — Cenário 2 (preenchimento)", () => {
  it("escreve assessment, roadmap e metadata.completed = true", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));

    const saved = await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
      source: "signup",
    });

    expect(saved.metadata.completed).toBe(true);
    expect(saved.metadata.source).toBe("signup");
    expect(saved.assessment.experience).toBe("zero");
    expect(saved.roadmap.recommendedCourses).toEqual(["html", "css"]);

    const row = fake.db.learning_profiles.find((r) => r.user_id === AUTH_UID);
    expect(row).not.toBeUndefined();
    expect(row.metadata.completed).toBe(true);
  });

  it("BUG: preenche também a coluna canónica `completed` (migration 001)", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));

    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });

    const row = fake.db.learning_profiles.find((r) => r.user_id === AUTH_UID);
    // `learning_profiles.completed` é a coluna booleana canónica do schema e é
    // copiada por link_legacy_profile. Deixá-la em false torna o estado
    // dependente de um blob jsonb e divergente do resto da base de dados.
    expect(row.completed).toBe(true);
    expect(row.source).toBe("signup");
  });

  it("BUG: usa o profiles.id resolvido, não o auth uid, para respeitar a FK", async () => {
    fake.db.profiles.push(
      makeProfile({ id: LEGACY_PROFILE_ID, auth_user_id: AUTH_UID }),
    );
    fake.setSession({ id: AUTH_UID });

    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });

    expect(
      fake.db.learning_profiles.find((r) => r.user_id === LEGACY_PROFILE_ID),
    ).toBeDefined();
    expect(
      fake.db.learning_profiles.find((r) => r.user_id === AUTH_UID),
    ).toBeUndefined();
  });

  it("lança erro explícito quando falta o uid", async () => {
    await expect(
      service.saveFullLearningProfile(null, { assessment: ASSESSMENT, roadmap: ROADMAP }),
    ).rejects.toThrow(/UID is required/i);
  });

  it("faz upsert idempotente: concluir duas vezes não duplica linhas", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));

    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });
    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: { ...ASSESSMENT, confidence: "high" },
      roadmap: ROADMAP,
    });

    const rows = fake.db.learning_profiles.filter((r) => r.user_id === AUTH_UID);
    expect(rows).toHaveLength(1);
    expect(rows[0].assessment.confidence).toBe("high");
  });

  it("propaga o erro do Supabase em vez de devolver success silencioso", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    fake.injectError({ message: "permission denied for table learning_profiles", code: "42501" });

    await expect(
      service.saveFullLearningProfile(AUTH_UID, { assessment: ASSESSMENT, roadmap: ROADMAP }),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("Cenário 4 — refresh: o onboarding concluído continua concluído", () => {
  it("volta a ler metadata.completed = true numa nova leitura", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID }));
    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });

    // "Refresh" = nova chamada ao Supabase, sem estado em memória.
    const reread = await service.getLearningProfile(AUTH_UID);
    expect(reread.metadata.completed).toBe(true);
    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(true);
  });
});

describe("Cenário 5 — logout / login: o onboarding NÃO aparece de novo", () => {
  it("BUG: utilizador normal continua concluído após novo login", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, name: "Maria" }));
    fake.authUsers.push(
      makeAuthUser({ id: AUTH_UID, email: "maria@webstart.test", name: "Maria" }),
    );
    fake.setSession({ id: AUTH_UID });

    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });

    // logout
    await fake.auth.signOut();
    expect(fake.session).toBeNull();

    // login outra vez
    const { error } = await fake.auth.signInWithPassword({
      email: "maria@webstart.test",
      password: "senha123",
    });
    expect(error).toBeNull();

    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(true);
  });

  it("BUG: utilizador migrado continua concluído após novo login", async () => {
    const authUser = makeAuthUser({
      id: AUTH_UID,
      email: "migrada@webstart.test",
      name: "Maria",
    });
    fake.authUsers.push(authUser);
    fake.db.profiles.push(
      makeProfile({
        id: LEGACY_PROFILE_ID,
        auth_user_id: AUTH_UID,
        email: "migrada@webstart.test",
        name: "Maria",
      }),
    );
    fake.setSession({ id: AUTH_UID });

    await service.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });

    await fake.auth.signOut();
    await fake.auth.signInWithPassword({
      email: "migrada@webstart.test",
      password: "senha123",
    });

    await expect(service.isAssessmentCompleted(AUTH_UID)).resolves.toBe(true);
  });
});
