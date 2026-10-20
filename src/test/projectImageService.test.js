import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabase } from "./harness.js";
import { makeAuthUser } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";

let fake;
let service;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  fake.setSession(makeAuthUser({ id: AUTH_UID, email: "person@example.test" }));
  service = await import("../services/projectImageService.js");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function makeFile(name, type, bytes = 16) {
  return new File([new Uint8Array(bytes)], name, { type });
}

function makeOversizedFile(name, type) {
  const file = makeFile(name, type);
  Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });
  return file;
}

describe("validateImageFile", () => {
  it("aceita JPEG, PNG e WebP até 5 MB", () => {
    expect(service.validateImageFile(makeFile("a.jpg", "image/jpeg"))).toBeNull();
    expect(service.validateImageFile(makeFile("b.png", "image/png"))).toBeNull();
    expect(service.validateImageFile(makeFile("c.webp", "image/webp"))).toBeNull();
  });

  it("recusa formatos não suportados", () => {
    expect(service.validateImageFile(makeFile("anim.gif", "image/gif"))).toMatch(/Formato/);
    expect(service.validateImageFile(makeFile("page.html", "text/html"))).toMatch(/Formato/);
  });

  it("recusa ficheiros acima de 5 MB", () => {
    expect(service.validateImageFile(makeOversizedFile("big.png", "image/png"))).toMatch(/5 MB/);
  });
});

describe("uploadProjectImage", () => {
  it("envia para a pasta do perfil e do projecto com nome único", async () => {
    const path = await service.uploadProjectImage({
      profileId: PROFILE_ID,
      projectId: PROJECT_ID,
      file: makeFile("screenshot.png", "image/png"),
      position: 0,
    });

    expect(path).toMatch(
      new RegExp(`^${PROFILE_ID}/${PROJECT_ID}/0-[0-9a-f-]{36}\\.png$`),
    );

    const bucket = fake.storage.from("project-images");
    expect(bucket.objects.has(path)).toBe(true);
    expect(bucket.objects.get(path).contentType).toBe("image/png");
  });

  it("valida o ficheiro antes de tocar no Storage", async () => {
    await expect(
      service.uploadProjectImage({
        profileId: PROFILE_ID,
        projectId: PROJECT_ID,
        file: makeFile("x.gif", "image/gif"),
        position: 0,
      }),
    ).rejects.toThrow(/Formato/);

    expect(fake.storage.calls).toHaveLength(0);
  });
});

describe("uploadProjectImages", () => {
  it("faz upload de vários ficheiros em paralelo", async () => {
    const paths = await service.uploadProjectImages({
      profileId: PROFILE_ID,
      projectId: PROJECT_ID,
      files: [makeFile("a.jpg", "image/jpeg"), makeFile("b.webp", "image/webp")],
    });

    expect(paths).toHaveLength(2);
    const bucket = fake.storage.from("project-images");
    expect(bucket.objects.size).toBe(2);
  });

  it("remove os uploads já feitos quando um dos ficheiros falha", async () => {
    const bucket = fake.storage.from("project-images");
    const originalUpload = bucket.upload.bind(bucket);
    bucket.upload = async (path, file, options) => {
      if (file.name === "bad.png") {
        return { data: null, error: { message: "network down", code: "500", details: null, hint: null } };
      }
      return originalUpload(path, file, options);
    };

    await expect(
      service.uploadProjectImages({
        profileId: PROFILE_ID,
        projectId: PROJECT_ID,
        files: [makeFile("ok.jpg", "image/jpeg"), makeFile("bad.png", "image/png")],
      }),
    ).rejects.toThrow(/network down/);

    expect(bucket.objects.size).toBe(0);
    expect(fake.storage.calls.some((call) => call.op === "remove")).toBe(true);
  });

  it("devolve lista vazia sem tocar no Storage sem ficheiros", async () => {
    await expect(
      service.uploadProjectImages({ profileId: PROFILE_ID, projectId: PROJECT_ID, files: [] }),
    ).resolves.toEqual([]);
    expect(fake.storage.calls).toHaveLength(0);
  });
});

describe("removeProjectImages", () => {
  it("remove os paths indicados", async () => {
    const bucket = fake.storage.from("project-images");
    await bucket.upload(`${PROFILE_ID}/${PROJECT_ID}/0-a.jpg`, makeFile("a.jpg", "image/jpeg"));

    await expect(
      service.removeProjectImages([`${PROFILE_ID}/${PROJECT_ID}/0-a.jpg`]),
    ).resolves.toBe(true);
    expect(bucket.objects.size).toBe(0);
  });

  it("nunca lança quando o Storage falha (best-effort)", async () => {
    const bucket = fake.storage.from("project-images");
    bucket.remove = async () => {
      throw new Error("network down");
    };

    await expect(service.removeProjectImages(["a/b/c.jpg"])).resolves.toBe(false);
  });
});

describe("projectImageUrl", () => {
  it("constrói a URL pública do bucket", () => {
    const path = `${PROFILE_ID}/${PROJECT_ID}/0-x.jpg`;
    expect(service.projectImageUrl(path)).toBe(
      `https://test.supabase.co/storage/v1/object/public/project-images/${path}`,
    );
    expect(service.projectImageUrl("")).toBe("");
  });
});
