/**
 * FASE 2 — regressões do nome do perfil (bugs #21, #22).
 *
 * Sintoma: "muitos utilizadores aparecem como 'Aluno WebStart' em vez do nome real".
 *
 * O fallback vivia em `createUserProfile` e lia UM campo só:
 *   `extra.name || user.user_metadata?.name || ''` → "Aluno WebStart"
 * O que fica de fora (e é onde estão as pessoas):
 *   - Google OAuth devolve `full_name` (e `name` só quando o claim vem); o
 *     `loginWithGoogle` não passa `options.data`, logo depende do que o
 *     provider devolveu.
 *   - `Register.jsx` tem `required` no campo, mas "   " passa a validação HTML
 *     e só morre no `.trim()`.
 *   - perfis migrados por `link_legacy_profile` herdam `name` da linha legacy.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { mockSupabase, loadUserService } from "./harness.js";
import { makeProfile } from "./fakeSupabase.js";
import { isIncompleteProfileName } from "../utils/profileValidation.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";

let fake;
let userService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  userService = await loadUserService();
});

function authUser(overrides = {}) {
  return {
    id: AUTH_UID,
    email: "maria.silva@webstart.ao",
    user_metadata: {},
    ...overrides,
  };
}

describe("BUG #21: o nome só era lido de user_metadata.name", () => {
  it("Google: usa full_name quando não há name", async () => {
    const created = await userService.createUserProfile(
      authUser({ user_metadata: { full_name: "Maria Silva" } }),
    );
    expect(created.name).toBe("Maria Silva");
  });

  it("GitHub: usa user_name quando não há name", async () => {
    const created = await userService.createUserProfile(
      authUser({ user_metadata: { user_name: "mariacs" } }),
    );
    expect(created.name).toBe("mariacs");
  });

  it("GitHub: usa preferred_username como último recurso de metadata", async () => {
    const created = await userService.createUserProfile(
      authUser({ user_metadata: { preferred_username: "maria-silva" } }),
    );
    expect(created.name).toBe("maria-silva");
  });

  it("ignora metadata só com espaços (o 'required' do HTML não apanha isto)", async () => {
    const created = await userService.createUserProfile(
      authUser({ user_metadata: { name: "   ", full_name: "Maria Silva" } }),
    );
    expect(created.name).toBe("Maria Silva");
  });

  it("o que o caller passa em extra.name ganha do metadata", async () => {
    const created = await userService.createUserProfile(
      authUser({ user_metadata: { name: "Do Metadata" } }),
      { name: "Do Formulario" },
    );
    expect(created.name).toBe("Do Formulario");
  });
});

describe("BUG #22: sem nome nenhum, deriva do email antes do fallback", () => {
  it("deriva do email quando não há metadata", async () => {
    const created = await userService.createUserProfile(
      authUser({ email: "maria.silva@webstart.ao", user_metadata: {} }),
    );
    expect(created.name).toBe("Maria Silva");
  });

  it("deriva de email com pontos, hífens e números", async () => {
    const created = await userService.createUserProfile(
      authUser({ email: "joao-pedro.dos-santos_2@webstart.ao", user_metadata: {} }),
    );
    expect(created.name).toBe("Joao Pedro Dos Santos 2");
  });

  it("email sem nada aproveitável ainda dá um nome derivado e não o genérico", async () => {
    const created = await userService.createUserProfile(
      authUser({ email: "1234@webstart.ao", user_metadata: {} }),
    );
    expect(created.name).not.toBe("Aluno WebStart");
  });

  it("sem email E sem metadata o cadastro nasce INCOMPLETO (name null)", async () => {
    // Antes caía em "Aluno WebStart", e era esse default que enchia o top 10
    // de linhas iguais. `name` passou a ser NULLABLE (migração 017) e quem não
    // escolheu nome é marcado como incompleto por `isIncompleteProfileName`.
    const created = await userService.createUserProfile(
      authUser({ email: "", user_metadata: {} }),
    );
    expect(created.name).toBeNull();
    expect(isIncompleteProfileName(created.name)).toBe(true);
  });

  it("o nome derivado também gera username legível", async () => {
    const created = await userService.createUserProfile(
      authUser({ email: "maria.silva@webstart.ao", user_metadata: {} }),
    );
    expect(created.username).toMatch(/^mariasilva/);
  });
});

describe("BUG #21: o nome fica gravado, não só em memória", () => {
  it("o nome derivado é relido do repositório", async () => {
    const created = await userService.createUserProfile(
      authUser({ user_metadata: { full_name: "Maria Silva" } }),
    );
    const read = await userService.getUserProfile(AUTH_UID);
    expect(read.name).toBe("Maria Silva");
    expect(read.name).toBe(created.name);
  });
});

describe("perfis migrados", () => {
  it("link_legacy_profile herda o nome legacy (não é substituído pelo genérico)", async () => {
    // Linha legacy da era Firebase: histórico + nome. Sem `auth_user_id`, como
    // antes de `link_legacy_profile` a ligar.
    fake.db.profiles.push(
      makeProfile({
        id: "22222222-2222-4222-8222-222222222222",
        legacy_firebase_uid: "fb-legacy-1",
        auth_user_id: null,
        name: "Ana Legacy",
        username: "analegacy",
        email: "ana@webstart.ao",
        xp: 120,
        completed_lessons: ["html-1"],
        created_at: "2024-01-01T00:00:00.000Z",
      }),
    );

    const created = await userService.createUserProfile(
      authUser({
        id: "33333333-3333-4333-8333-333333333333",
        email: "ana@webstart.ao",
        user_metadata: { legacy_firebase_uid: "fb-legacy-1" },
      }),
    );

    expect(created.name).toBe("Ana Legacy");
  });
});