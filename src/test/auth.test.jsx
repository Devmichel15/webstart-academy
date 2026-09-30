/**
 * ETAPA 8 — autenticação: sessão,映射 user→profile e race conditions.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { mockSupabase, loadAuthService, loadAppModules } from "./harness.js";
import { makeAuthUser, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";

describe("authService", () => {
  let fake;
  let service;

  beforeEach(async () => {
    vi.resetModules();
    fake = mockSupabase({
      authUsers: [
        makeAuthUser({
          id: AUTH_UID,
          email: "maria@webstart.test",
          password: "senha123",
          name: "Maria Silva",
        }),
      ],
    });
    service = await loadAuthService();
  });

  it("login válido devolve o utilizador correcto", async () => {
    const user = await service.loginWithEmail("maria@webstart.test", "senha123");
    expect(user.id).toBe(AUTH_UID);
    expect(user.email).toBe("maria@webstart.test");
  });

  it("login válido deixa a sessão disponível para getUser()", async () => {
    await service.loginWithEmail("maria@webstart.test", "senha123");
    const current = await service.getCurrentUser();
    expect(current.id).toBe(AUTH_UID);
  });

  it("senha errada lança erro com mensagem em português, sem vazar SQL", async () => {
    await expect(
      service.loginWithEmail("maria@webstart.test", "errada"),
    ).rejects.toThrow(/Email ou senha incorretos/i);
  });

  it("utilizador inexistente devolve mensagem de utilizador não encontrado", async () => {
    await expect(
      service.loginWithEmail("ninguem@webstart.test", "senha123"),
    ).rejects.toThrow(/não encontrado|incorretos/i);
  });

  it("email inválido é mapeado", async () => {
    await expect(service.loginWithEmail("nao-e-email", "x")).rejects.toThrow(
      /Email inválido|incorretos/i,
    );
  });

  it("Supabase indisponível (TypeError de rede) dá mensagem de servidor, não crash", async () => {
    fake.auth.signInWithPassword = () =>
      Promise.resolve({
        data: { user: null },
        error: { name: "TypeError", message: "Failed to fetch" },
      });

    await expect(
      service.loginWithEmail("maria@webstart.test", "senha123"),
    ).rejects.toThrow(/Não foi possível contactar o servidor|internet/i);
  });

  it("logout limpa a sessão", async () => {
    await service.loginWithEmail("maria@webstart.test", "senha123");
    await service.logoutUser();
    await expect(service.getCurrentUser()).resolves.toBeNull();
  });

  it("onAuthStateChanged entrega o utilizador actual e permite cancelar", async () => {
    fake.setSession({ id: AUTH_UID, email: "maria@webstart.test" });

    const seen = [];
    const unsubscribe = service.onAuthStateChanged((user, event) => seen.push([user?.id ?? null, event]));

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen[0][0]).toBe(AUTH_UID);
    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });

  it("registerWithEmail cria o utilizador e devolve o id", async () => {
    const user = await service.registerWithEmail({
      name: "Novo",
      email: "novo@webstart.test",
      password: "senha123",
    });
    expect(user.email).toBe("novo@webstart.test");
  });

  it("registerWithEmail rejeita email já registado", async () => {
    await expect(
      service.registerWithEmail({
        name: "Maria",
        email: "maria@webstart.test",
        password: "senha123",
      }),
    ).rejects.toThrow(/já está registrado/i);
  });
});

describe("AuthContext — fluxo login → sessão → user", () => {
  let fake;
  let mod;

  beforeEach(async () => {
    vi.resetModules();
    fake = mockSupabase({
      authUsers: [
        makeAuthUser({
          id: AUTH_UID,
          email: "maria@webstart.test",
          password: "senha123",
          name: "Maria Silva",
        }),
      ],
    });
    mod = await loadAppModules();
  });

  function Probe() {
    const { user, loading, error, isAuthenticated } = mod.useAuthContext();
    if (loading) return <p>loading</p>;
    return (
      <p data-testid="state">
        {String(user?.id ?? "none")}|{String(user?.email ?? "none")}|{String(error ?? "")}|
        {String(isAuthenticated)}
      </p>
    );
  }

  it("sem sessão: não tenta carregar dados privados e termina em loading = false", async () => {
    render(
      <mod.AuthProvider>
        <Probe />
      </mod.AuthProvider>,
    );

    await waitFor(() => expect(screen.queryByText("loading")).toBeNull());
    expect(screen.getByTestId("state").textContent).toBe("none|none||false");
    expect(
      fake.queries.filter((q) => q.table === "profiles").length,
    ).toBe(0);
  });

  it("login válido: expõe o utilizador do Supabase Auth e carrega o perfil", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, name: "Maria Silva", email: "maria@webstart.test" }),
    );

    render(
      <mod.AuthProvider>
        <Probe />
      </mod.AuthProvider>,
    );

    await act(async () => {
      await fake.auth.signInWithPassword({
        email: "maria@webstart.test",
        password: "senha123",
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toContain(AUTH_UID),
    );
    expect(screen.getByTestId("state").textContent).toContain("maria@webstart.test");
    expect(screen.getByTestId("state").textContent).toContain("true");
  });

  it("conta nova: cria o profiles.id = auth.users.id e expõe esse utilizador", async () => {
    render(
      <mod.AuthProvider>
        <Probe />
      </mod.AuthProvider>,
    );

    await act(async () => {
      await fake.auth.signUp({
        email: "novo@webstart.test",
        password: "senha123",
        options: { data: { name: "Novo Aluno", provider: "email" } },
      });
    });

    await waitFor(() => expect(fake.profileById(fake.currentUserId())).not.toBeNull());
    expect(fake.profileById(fake.currentUserId()).name).toBe("Novo Aluno");
    expect(screen.getByTestId("state").textContent).toContain("novo@webstart.test");
  });

  it("erro de sincronização do perfil é exposto, não engolido", async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, name: "Maria Silva" }));
    // Falha persistente na leitura do perfil: o AuthContext tem de surfacear
    // o erro em vez de deixar o utilizador num estado aparentemente saudável.
    fake.setError({ message: "permission denied for table profiles", code: "42501" });

    render(
      <mod.AuthProvider>
        <Probe />
      </mod.AuthProvider>,
    );

    await act(async () => {
      await fake.auth.signInWithPassword({
        email: "maria@webstart.test",
        password: "senha123",
      });
    });

    await waitFor(() => expect(screen.getByTestId("state").textContent).not.toContain("|loading"));
    // Não pode terminar com um estado que finja que está tudo bem.
    expect(screen.getByTestId("state").textContent).toContain("Não foi possível sincronizar");
  });

  it("race condition: não consulta profiles antes de existir user.id", async () => {
    render(
      <mod.AuthProvider>
        <Probe />
      </mod.AuthProvider>,
    );

    await waitFor(() => expect(screen.queryByText("loading")).toBeNull());
    expect(fake.queries.length).toBe(0);
  });

  it("login → logout: volta ao estado sem utilizador", async () => {
    fake.db.profiles.push(
      makeProfile({ id: AUTH_UID, name: "Maria Silva", email: "maria@webstart.test" }),
    );

    render(
      <mod.AuthProvider>
        <Probe />
      </mod.AuthProvider>,
    );

    await act(async () => {
      await fake.auth.signInWithPassword({
        email: "maria@webstart.test",
        password: "senha123",
      });
    });
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toContain("true"),
    );

    await act(async () => {
      await fake.auth.signOut();
    });

    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("none|none||false"),
    );
  });
});
