/**
 * Tarefa 5 — Backfill de `learning_profiles.completed`.
 *
 * A coluna canónica `learning_profiles.completed` foi declarada em
 * 001_initial_schema.sql, mas `mapLearningProfileRow` não a lê e
 * `isAssessmentCompleted` só olha para `metadata.completed`. Os registos
 * gravados ANTES de o passatem a existir (ou por `link_legacy_profile`, que
 * copia assessment+roadmap+metadata mas deixa `completed` como veio) ficam com
 * a coluna a `null`/`false`.
 *
 * Estes testes fixam o contrato de leitura e descrevem o SQL de backfill em
 * docs/backfill-learning-profiles-completed.sql (que NÃO é executado aqui).
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { mockSupabase, loadLearningProfileService, loadUserService } from "./harness.js";
import { learningProfileRow, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";

const ASSESSMENT = {
  experience: "know_basics",
  objective: "first_job",
  answeredAt: "2024-05-01T00:00:00.000Z",
};
const ROADMAP = { recommendedCourses: ["html", "css"], firstStep: { courseId: "html" } };

let fake;
let learningProfileService;
let userService;

function seedProfile() {
  fake.db.profiles.push(makeProfile({ id: AUTH_UID, name: "Maria", email: "maria@webstart.test" }));
  fake.setSession({ id: AUTH_UID });
}

function row() {
  return fake.db.learning_profiles.find((r) => r.user_id === AUTH_UID);
}

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  learningProfileService = await loadLearningProfileService();
  userService = await loadUserService();
  seedProfile();
});

describe("registo antigo — coluna canónica vazia", () => {
  it("BUG #15: completed = null mas metadata.completed = true conta como concluído", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: null,
        metadataCompleted: true,
        assessment: ASSESSMENT,
        roadmap: ROADMAP,
      }),
    );

    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(true);
    await expect(learningProfileService.isAssessmentCompleted(AUTH_UID)).resolves.toBe(true);
  });

  it("BUG #15: completed = false mas metadata.completed = true conta como concluído", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: false,
        metadataCompleted: true,
        assessment: ASSESSMENT,
        roadmap: ROADMAP,
      }),
    );

    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(true);
  });

  it("BUG #15: assessment preenchido conta como concluído mesmo sem qualquer flag", async () => {
    // Perfil migrado cujo metadata perdeu o campo `completed`.
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: null,
        metadata: { version: 1, source: "legacy" },
        assessment: ASSESSMENT,
        roadmap: ROADMAP,
      }),
    );

    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(true);
  });
});

describe("registo recente — coluna canónica autoritativa", () => {
  it("completed = true conta como concluído mesmo sem metadata.completed", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: true,
        metadataCompleted: false,
        assessment: ASSESSMENT,
        roadmap: ROADMAP,
      }),
    );

    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(true);
  });

  it("getLearningProfile expõe a coluna canónica `completed`", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { completed: true, assessment: ASSESSMENT }),
    );

    const profile = await learningProfileService.getLearningProfile(AUTH_UID);

    expect(profile.completed).toBe(true);
    expect(profile.assessment).toEqual(ASSESSMENT);
  });
});

describe("registo genuinamente por concluir", () => {
  it("sem completed, sem metadata.completed e sem assessment: não concluído", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: null,
        metadata: { version: 1, source: "signup" },
        assessment: {},
        roadmap: {},
      }),
    );

    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(false);
  });

  it("sem learning_profile nenhum: não concluído", async () => {
    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(false);
  });

  it("assessment só com respostas parciais não conta como concluído", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: null,
        metadata: { version: 1 },
        assessment: { experience: "know_basics" },
        roadmap: {},
      }),
    );

    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(false);
  });
});

describe("escrita — o que já grava hoje", () => {
  it("saveFullLearningProfile escreve a coluna canónica e o metadata", async () => {
    await learningProfileService.saveFullLearningProfile(AUTH_UID, {
      assessment: ASSESSMENT,
      roadmap: ROADMAP,
    });

    expect(row().completed).toBe(true);
    expect(row().metadata.completed).toBe(true);
    await expect(learningProfileService.getAssessmentStatus(AUTH_UID)).resolves.toBe(true);
  });

  it("não reescreve um learning_profile que já estava completo", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { completed: true, assessment: ASSESSMENT }),
    );

    // um assessment reenviado não pode apagar o `completed` existente
    await learningProfileService.saveFullLearningProfile(AUTH_UID, {
      assessment: { ...ASSESSMENT, objective: "change_career" },
      roadmap: ROADMAP,
    });

    expect(row().completed).toBe(true);
  });
});

describe("backfill — o que o SQL tem de corrigir", () => {
  it("o perfil de um utilizador com coluna null é lido como concluído", async () => {
    // Estado que o backfill (docs/backfill-learning-profiles-completed.sql)
    // tem de corrigir: completed = null, metadata.completed = true.
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, {
        completed: null,
        metadataCompleted: true,
        assessment: ASSESSMENT,
        roadmap: ROADMAP,
      }),
    );

    // Antes do backfill o bug #15 escondia o registo; depois de lido, tem de
    // aparecer como concluído e sem assessment forçado.
    expect(await learningProfileService.getAssessmentStatus(AUTH_UID)).toBe(true);
    expect(await learningProfileService.isAssessmentCompleted(AUTH_UID)).toBe(true);
  });

  it("o perfil canónico continua a ser o do auth uid (profiles.id)", async () => {
    fake.db.learning_profiles.push(
      learningProfileRow(AUTH_UID, { completed: null, metadataCompleted: true }),
    );

    const profileId = await userService.resolveProfileId(AUTH_UID);

    expect(profileId).toBe(AUTH_UID);
  });
});