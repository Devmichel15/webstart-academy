/**
 * Tarefa 1 — `updateOwnProfile` e `changePassword`.
 *
 * O foco é a garantia de que o back-end não confia no formulário: a whitelist
 * corta `role`/`xp` mesmo que venham no payload, e o nome é revalidado no
 * servidor. Um teste de front-end que passa não prova nada disto.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { mockSupabase, loadUserService, loadAuthService } from "./harness.js";
import { makeAuthUser, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "44444444-4444-4444-8444-444444444444";
const EMAIL = "maria.silva@webstart.ao";
const PASSWORD = "senha-antiga-123";

let fake;
let userService;
let authService;

function row(id = AUTH_UID) {
  return fake.db.profiles.find((p) => p.id === id);
}

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase({
    authUsers: [makeAuthUser({ id: AUTH_UID, email: EMAIL, password: PASSWORD })],
  });
  fake.db.profiles.push(
    makeProfile({ id: AUTH_UID, auth_user_id: AUTH_UID, name: "Maria Silva", email: EMAIL, xp: 40 }),
  );
  // Sem sessão, a RLS do duplo deixa passar zero linhas e o `update` responde
  // 204 sem escrever — um teste que "passa" sem ter gravado nada.
  fake.setSession({ id: AUTH_UID, email: EMAIL });
  userService = await loadUserService();
  authService = await loadAuthService();
});

describe("updateOwnProfile — o nome", () => {
  it("grava um nome válido e devolve o perfil já normalizado", async () => {
    const updated = await userService.updateOwnProfile(AUTH_UID, { name: "  Maria   Costa  " });
    expect(updated.name).toBe("Maria Costa");
    expect(row().name).toBe("Maria Costa");
  });

  it("rejeita nome vazio no servidor (não confia no required do HTML)", async () => {
    await expect(userService.updateOwnProfile(AUTH_UID, { name: "   " })).rejects.toThrow(
      /nome é obrigatório/i,
    );
    expect(row().name).toBe("Maria Silva");
  });

  it("rejeita o default histórico", async () => {
    await expect(
      userService.updateOwnProfile(AUTH_UID, { name: "aluno webstart" }),
    ).rejects.toThrow(/Aluno WebStart/);
    expect(row().name).toBe("Maria Silva");
  });

  it("rejeita nomes de 1 e de 61 caracteres, aceita 2 e 60", async () => {
    await expect(userService.updateOwnProfile(AUTH_UID, { name: "A" })).rejects.toThrow(
      /pelo menos 2/i,
    );
    await expect(userService.updateOwnProfile(AUTH_UID, { name: "x".repeat(61) })).rejects.toThrow(
      /no máximo 60/i,
    );

    await userService.updateOwnProfile(AUTH_UID, { name: "Ana" });
    expect(row().name).toBe("Ana");
    await userService.updateOwnProfile(AUTH_UID, { name: "y".repeat(60) });
    expect(row().name).toHaveLength(60);
  });
});

describe("updateOwnProfile — whitelist", () => {
  it("descarta campos de privilégio enviados pelo formulário", async () => {
    // A RLS já impede editar outra linha, mas `role` é a PRÓPRIA linha: sem
    // whitelist, qualquer aluno podia escrever `role: 'admin'` no seu perfil.
    await userService.updateOwnProfile(AUTH_UID, {
      name: "Maria Silva",
      role: "admin",
      xp: 999999,
      is_premium: true,
      welcome_email_sent: true,
    });

    expect(row().role).toBe("student");
    expect(row().xp).toBe(40);
    expect(row().is_premium).toBe(false);
    expect(row().welcome_email_sent).toBe(false);
  });

  it("aceita os campos de perfil que fazem sentido", async () => {
    const updated = await userService.updateOwnProfile(AUTH_UID, {
      name: "Maria Silva",
      bio: "  Olá, estou a aprender React.  ",
      githubUrl: "github.com/mariasilva",
      websiteUrl: "",
      isPublic: false,
    });

    expect(updated.bio).toBe("Olá, estou a aprender React.");
    expect(updated.githubUrl).toBe("https://github.com/mariasilva");
    expect(updated.websiteUrl).toBeNull();
    expect(updated.isPublic).toBe(false);
  });

  it("rejeita URL que não seja http(s)", async () => {
    await expect(
      userService.updateOwnProfile(AUTH_UID, { name: "Maria Silva", githubUrl: "javascript:alert(1)" }),
    ).rejects.toThrow(/URL inválida/i);
    expect(row().github_url ?? null).toBeNull();
  });

  it("não escreve nada quando o payload é só campos desconhecidos", async () => {
    const before = JSON.stringify(row());
    await userService.updateOwnProfile(AUTH_UID, { role: "admin", id: "x" });
    expect(JSON.stringify(row())).toBe(before);
  });

  it("erro claro quando não há perfil para a sessão", async () => {
    // A sessão é que decide de quem é o perfil (é o JWT que a RPC lê), não o
    // uid que o chamador passa. Sem linha para essa sessão, o erro é do
    // servidor — e em português.
    fake.setSession({ id: "99999999-9999-4999-8999-999999999999" });
    await expect(
      userService.updateOwnProfile("99999999-9999-4999-8999-999999999999", { name: "Ana" }),
    ).rejects.toThrow(/não encontrado/i);
  });

  it("o uid passado pelo chamador não redireciona a escrita", async () => {
    // Passar o id de outra pessoa não escreve na linha dela: a RPC resolve a
    // linha pelo `auth.uid()` da sessão.
    const updated = await userService.updateOwnProfile(
      "99999999-9999-4999-8999-999999999999",
      { name: "Maria Silva" },
    );

    expect(updated.name).toBe("Maria Silva");
    expect(row().name).toBe("Maria Silva");
  });
});

describe("updateOwnProfile — perfis migrados (id ≠ auth.uid)", () => {
  it("escreve na linha ligada por auth_user_id", async () => {
    // Cenário real: a conta tem UMA linha, a migrada do Firebase, cujo `id` é
    // um uuidv5 e não o auth uid. A RLS reconhece por `auth_user_id`.
    fake.db.profiles.length = 0;
    const legacyId = "55555555-5555-4555-8555-555555555555";
    fake.db.profiles.push(
      makeProfile({
        id: legacyId,
        legacy_firebase_uid: "fb-1",
        auth_user_id: AUTH_UID,
        name: "Aluno WebStart",
        email: EMAIL,
        xp: 120,
      }),
    );

    const updated = await userService.updateOwnProfile(AUTH_UID, { name: "Maria Silva" });

    expect(updated.id).toBe(legacyId);
    expect(row(legacyId).name).toBe("Maria Silva");
  });
});

describe("updateOwnProfile — o servidor é quem decide", () => {
  // Tudo o que vem a seguir é o que a migração 018 garante. O mesmo teste com
  // a implementação antiga (filtro no cliente) passava a verde sem o utilizador
  // estar protegido em nada: o filtro vivia no browser que o atacante controla.

  it("a RPC é o caminho de escrita, não um UPDATE directo", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });
    await userService.updateOwnProfile(AUTH_UID, { name: "Maria Silva" });

    const calls = fake.rpcCalls.filter((c) => c.fnName === "update_own_profile");
    expect(calls).toHaveLength(1);
    expect(calls[0].args.p_patch).toEqual({ name: "Maria Silva" });
  });

  it("um payload cru com `role` é recusado pelo servidor", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });

    // Sem passar pelo updateOwnProfile: é isto que um cliente hostil faz.
    const { error } = await fake.rpc("update_own_profile", {
      p_patch: { name: "Maria Silva", role: "admin" },
    });

    expect(error).toBeTruthy();
    expect(error.code).toBe("42501");
    expect(row().role).toBe("student");
  });

  it("um UPDATE directo a `role` é abortado pelo trigger", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });

    const { error } = await fake.from("profiles").update({ role: "admin" }).eq("id", AUTH_UID);

    expect(error).toBeTruthy();
    expect(error.code).toBe("42501");
    expect(row().role).toBe("student");
  });

  it("o trigger deixa passar xp e streak (o modelo de progresso ainda é do cliente)", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });

    const { error } = await fake
      .from("profiles")
      .update({ xp: 400, streak: 7 })
      .eq("id", AUTH_UID);

    expect(error).toBeNull();
    expect(row().xp).toBe(400);
    expect(row().streak).toBe(7);
  });

  it("um admin continua a poder promover quem quiser", async () => {
    const other = "77777777-7777-4777-8777-777777777777";
    row().role = "admin";
    fake.db.profiles.push(makeProfile({ id: other, email: "bento@webstart.ao", role: "student" }));
    fake.setSession({ id: AUTH_UID, email: EMAIL });

    const { error } = await fake.from("profiles").update({ role: "admin" }).eq("id", other);

    expect(error).toBeNull();
    expect(fake.profileById(other).role).toBe("admin");
  });

  it("o servidor rejeita um nome inválido mesmo sem passar pelo validador do cliente", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });

    const { error } = await fake.rpc("update_own_profile", { p_patch: { name: "Aluno WebStart" } });
    expect(error?.code).toBe("22023");

    const short = await fake.rpc("update_own_profile", { p_patch: { name: "A" } });
    expect(short.error?.code).toBe("22023");

    const long = await fake.rpc("update_own_profile", { p_patch: { name: "x".repeat(61) } });
    expect(long.error?.code).toBe("22023");

    expect(row().name).not.toBe("Aluno WebStart");
  });

  it("o servidor rejeita uma URL que não seja http(s)", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });

    const { error } = await fake.rpc("update_own_profile", {
      p_patch: { website_url: "javascript:alert(1)" },
    });

    expect(error?.code).toBe("22023");
    expect(row().website_url ?? null).toBeNull();
  });

  it("sem sessão não há escrita nenhuma", async () => {
    const before = row().name;
    fake.setSession(null);

    const { error } = await fake.rpc("update_own_profile", { p_patch: { name: "Outra Pessoa" } });

    expect(error?.code).toBe("42501");
    expect(row().name).toBe(before);
  });
});

describe("changePassword", () => {
  it("altera a senha depois de confirmar a atual", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });
    await authService.changePassword({
      currentPassword: PASSWORD,
      newPassword: "nova-super-segura",
    });

    const stored = fake.authUsers.find((u) => u.id === AUTH_UID);
    expect(stored.password).toBe("nova-super-segura");
  });

  it("senha atual errada: mensagem clara e nada é alterado", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });
    await expect(
      authService.changePassword({
        currentPassword: "senha-errada",
        newPassword: "nova-super-segura",
      }),
    ).rejects.toThrow(/senha atual está incorreta/i);

    const stored = fake.authUsers.find((u) => u.id === AUTH_UID);
    expect(stored.password).toBe(PASSWORD);
  });

  it("email desconhecido na re-autenticação também diz que a senha está errada", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });
    await expect(
      authService.changePassword({
        currentPassword: PASSWORD,
        newPassword: "nova-super-segura",
        email: "ninguem@webstart.ao",
      }),
    ).rejects.toThrow(/senha atual está incorreta/i);
  });

  it("sem sessão e sem email não há por quem se autenticar", async () => {
    fake.setSession(null);
    await expect(
      authService.changePassword({ currentPassword: PASSWORD, newPassword: "nova-super-segura" }),
    ).rejects.toThrow(/identificar a tua conta/i);
  });

  // O GoTrue aceitaria 6; nós exigimos 8. É cliente, não servidor — ver a
  // nota de dívida no authService — mas o serviço não deve deixar passar.
  it.each([["1234567", 7], ["123456", 6], ["", 0]])(
    "rejeita a nova senha de %s caracteres antes de tocar na rede",
    async (senha) => {
      fake.setSession({ id: AUTH_UID, email: EMAIL });
      await expect(
        authService.changePassword({ currentPassword: PASSWORD, newPassword: senha }),
      ).rejects.toThrow(/pelo menos 8 caracteres/i);

      const stored = fake.authUsers.find((u) => u.id === AUTH_UID);
      expect(stored.password).toBe(PASSWORD);
    },
  );

  it("aceita exatamente 8 caracteres", async () => {
    fake.setSession({ id: AUTH_UID, email: EMAIL });
    await authService.changePassword({ currentPassword: PASSWORD, newPassword: "12345678" });

    const stored = fake.authUsers.find((u) => u.id === AUTH_UID);
    expect(stored.password).toBe("12345678");
  });
});
