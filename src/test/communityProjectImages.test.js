import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabase } from "./harness.js";
import { makeAuthUser, makeProfile, postgrestError } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";

const BASE_FORM = {
  title: "Weather App",
  description: "Aplicação de previsão do tempo com API externa.",
  projectUrl: "https://weather-app.vercel.app",
  githubUrl: "",
  tags: ["javascript", "api"],
};

let fake;
let communityService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  fake.setSession(makeAuthUser({ id: AUTH_UID, email: "person@example.test" }));
  fake.db.profiles.push(
    makeProfile({ id: PROFILE_ID, auth_user_id: AUTH_UID, email: "person@example.test" }),
  );
  communityService = await import("../services/communityService.js");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function makeFile(name, type, bytes = 16) {
  return new File([new Uint8Array(bytes)], name, { type });
}

function seedProject(imagePaths = []) {
  fake.db.community_projects.push({
    id: PROJECT_ID,
    author_id: PROFILE_ID,
    title: BASE_FORM.title,
    description: BASE_FORM.description,
    tags: ["javascript", "api"],
    project_url: BASE_FORM.project_url || "https://weather-app.vercel.app",
    github_url: null,
    image_paths: imagePaths,
    like_count: 0,
    comment_count: 0,
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
  });
  return fake.db.community_projects[0];
}

describe("createProject com imagens", () => {
  it("faz upload e grava os paths no projecto novo", async () => {
    const files = [makeFile("a.png", "image/png"), makeFile("b.jpg", "image/jpeg")];

    const project = await communityService.createProject(AUTH_UID, {
      ...BASE_FORM,
      images: files,
    });

    expect(project.imagePaths).toHaveLength(2);

    const row = fake.db.community_projects[0];
    expect(row.id).toBe(project.id);
    expect(row.image_paths).toEqual(project.imagePaths);
    expect(row.author_id).toBe(PROFILE_ID);

    const bucket = fake.storage.from("project-images");
    expect(bucket.objects.size).toBe(2);
    for (const path of project.imagePaths) {
      expect(path.startsWith(`${PROFILE_ID}/${project.id}/`)).toBe(true);
      expect(bucket.objects.has(path)).toBe(true);
    }
  });

  it("publica apenas com texto (sem imagens), como antes", async () => {
    const project = await communityService.createProject(AUTH_UID, BASE_FORM);

    expect(project.imagePaths).toEqual([]);
    expect(fake.db.community_projects[0].image_paths).toEqual([]);
    expect(fake.storage.calls).toHaveLength(0);
  });

  it("recusa formato inválido antes de inserir ou enviar", async () => {
    await expect(
      communityService.createProject(AUTH_UID, {
        ...BASE_FORM,
        images: [makeFile("x.gif", "image/gif")],
      }),
    ).rejects.toThrow(/Formato/);

    expect(fake.db.community_projects).toHaveLength(0);
    expect(fake.storage.from("project-images").objects.size).toBe(0);
  });

  it("limpa os uploads quando o INSERT falha", async () => {
    const originalFrom = fake.from.bind(fake);
    fake.from = (table) => {
      const builder = originalFrom(table);
      if (table === "community_projects") {
        const originalExecute = builder.execute.bind(builder);
        builder.execute = async () => {
          if (builder.operation === "insert") {
            return { data: null, error: postgrestError("insert failed", "XX000"), count: null, status: 500 };
          }
          return originalExecute();
        };
      }
      return builder;
    };

    await expect(
      communityService.createProject(AUTH_UID, {
        ...BASE_FORM,
        images: [makeFile("a.png", "image/png")],
      }),
    ).rejects.toThrow(/insert failed/);

    expect(fake.storage.from("project-images").objects.size).toBe(0);
  });
});

describe("updateProject com imagens", () => {
  it("mantém, acrescenta e remove imagens correctamente", async () => {
    const bucket = fake.storage.from("project-images");
    const pathA = `${PROFILE_ID}/${PROJECT_ID}/0-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
    const pathB = `${PROFILE_ID}/${PROJECT_ID}/1-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg`;
    await bucket.upload(pathA, makeFile("a.jpg", "image/jpeg"));
    await bucket.upload(pathB, makeFile("b.jpg", "image/jpeg"));
    seedProject([pathA, pathB]);

    const current = await communityService.getProjectById(PROJECT_ID);
    const updated = await communityService.updateProject(PROJECT_ID, current, {
      title: "Weather App v2",
      description: "Descrição actualizada com mais detalhes.",
      projectUrl: "https://weather-app.vercel.app",
      githubUrl: "https://github.com/pessoa/weather-app",
      tags: ["javascript"],
      imagePaths: [pathA],
      images: [makeFile("nova.png", "image/png")],
    });

    expect(updated.imagePaths).toHaveLength(2);
    expect(updated.imagePaths[0]).toBe(pathA);
    expect(updated.title).toBe("Weather App v2");

    const row = fake.db.community_projects[0];
    expect(row.image_paths).toEqual(updated.imagePaths);
    expect(bucket.objects.has(pathA)).toBe(true);
    expect(bucket.objects.has(pathB)).toBe(false);
    expect(bucket.objects.size).toBe(2);
  });

  it("update só de texto não toca no Storage", async () => {
    const pathA = `${PROFILE_ID}/${PROJECT_ID}/0-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
    seedProject([pathA]);
    const current = await communityService.getProjectById(PROJECT_ID);
    fake.storage.calls.length = 0;

    await communityService.updateProject(PROJECT_ID, current, {
      title: "Weather App",
      description: "Descrição actualizada com mais detalhes.",
      projectUrl: "https://weather-app.vercel.app",
      githubUrl: "",
      tags: ["javascript"],
      imagePaths: [pathA],
      images: [],
    });

    expect(fake.storage.calls).toHaveLength(0);
    expect(fake.db.community_projects[0].image_paths).toEqual([pathA]);
  });

  it("rejeita mais de 4 imagens no total", async () => {
    const paths = [0, 1, 2].map(
      (i) => `${PROFILE_ID}/${PROJECT_ID}/${i}-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`,
    );
    seedProject(paths);
    const current = await communityService.getProjectById(PROJECT_ID);

    await expect(
      communityService.updateProject(PROJECT_ID, current, {
        ...BASE_FORM,
        imagePaths: paths,
        images: [makeFile("a.png", "image/png"), makeFile("b.png", "image/png")],
      }),
    ).rejects.toThrow(/Máximo de 4/);
  });
});

describe("deleteProject com imagens", () => {
  it("apaga a linha e remove os ficheiros associados", async () => {
    const bucket = fake.storage.from("project-images");
    const pathA = `${PROFILE_ID}/${PROJECT_ID}/0-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
    await bucket.upload(pathA, makeFile("a.jpg", "image/jpeg"));
    const row = seedProject([pathA]);

    await communityService.deleteProject(row.id, row.image_paths);

    expect(fake.db.community_projects).toHaveLength(0);
    expect(bucket.objects.size).toBe(0);
  });

  it("não falha se a limpeza do Storage falhar (best-effort)", async () => {
    const bucket = fake.storage.from("project-images");
    const pathA = `${PROFILE_ID}/${PROJECT_ID}/0-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
    await bucket.upload(pathA, makeFile("a.jpg", "image/jpeg"));
    const row = seedProject([pathA]);
    bucket.remove = async () => {
      throw new Error("network down");
    };

    await expect(
      communityService.deleteProject(row.id, row.image_paths),
    ).resolves.toBeUndefined();

    expect(fake.db.community_projects).toHaveLength(0);
  });
});

describe("validateProjectForm — limite de imagens", () => {
  it("recusa mais de 4 imagens (existentes + novas)", () => {
    const paths = [0, 1, 2, 3].map(
      (i) => `${PROFILE_ID}/${PROJECT_ID}/${i}-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`,
    );

    const result = communityService.validateProjectForm({
      ...BASE_FORM,
      tags: ["javascript"],
      imagePaths: paths,
      images: [makeFile("nova.png", "image/png")],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.images).toMatch(/Máximo de 4/);
  });

  it("aceita exactamente 4 imagens", () => {
    const paths = [0, 1, 2].map(
      (i) => `${PROFILE_ID}/${PROJECT_ID}/${i}-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`,
    );

    const result = communityService.validateProjectForm({
      ...BASE_FORM,
      tags: ["javascript"],
      imagePaths: paths,
      images: [makeFile("a.png", "image/png")],
    });

    expect(result.valid).toBe(true);
  });
});
