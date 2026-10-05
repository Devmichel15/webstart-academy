/**
 * Tarefa 1/2 — regras de cadastro e validação do perfil.
 *
 * O ponto central deste ficheiro é o bloco "paridade JS/SQL": a regra
 * "cadastro incompleto" é avaliada no browser (para abrir o modal), no
 * back-end JS (para validar o nome) e dentro do Postgres (para anonimizar o
 * top 10). Se os literais deixarem de bater certo, o mesmo utilizador é
 * "completo" num ecrã e "anónimo" noutro — que é exactamente o bug que
 * originou este trabalho.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_DISPLAY_NAME,
  BIO_MAX,
  DEFAULT_PROFILE_NAME,
  NAME_MAX,
  NAME_MIN,
  isDefaultProfileName,
  isIncompleteProfileName,
  isValidUrl,
  normalizeName,
  normalizeUrl,
  validatePasswordChange,
  validateProfileName,
} from "../utils/profileValidation.js";

const MIGRATIONS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../supabase/migrations",
);
const MIGRATION_PATH = resolve(MIGRATIONS_DIR, "017_profile_name_and_ranking.sql");
const MIGRATION_018_PATH = resolve(MIGRATIONS_DIR, "018_own_profile_update.sql");

describe("a regra de cadastro incompleto", () => {
  it("cobre null, undefined, vazio e só espaços", () => {
    expect(isIncompleteProfileName(null)).toBe(true);
    expect(isIncompleteProfileName(undefined)).toBe(true);
    expect(isIncompleteProfileName("")).toBe(true);
    expect(isIncompleteProfileName("   ")).toBe(true);
    expect(isIncompleteProfileName("\t\n ")).toBe(true);
  });

  it("cobre o default histórico, sem importar maiúsculas nem espaços", () => {
    expect(isIncompleteProfileName("Aluno WebStart")).toBe(true);
    expect(isIncompleteProfileName("aluno webstart")).toBe(true);
    expect(isIncompleteProfileName("ALUNO WEBSTART")).toBe(true);
    expect(isIncompleteProfileName("  Aluno   WebStart  ")).toBe(true);
    expect(isDefaultProfileName(" aluno webstart ")).toBe(true);
  });

  it("um nome a sério não é cadastro incompleto", () => {
    expect(isIncompleteProfileName("Maria Silva")).toBe(false);
    expect(isIncompleteProfileName("Ana")).toBe(false);
    // 1 carácter: incompleto? não. Curto demais para gravar, mas isso é o
    // `validateProfileName` — as duas regras respondem a perguntas diferentes.
    expect(isIncompleteProfileName("A")).toBe(false);
  });

  it("não confunde com nomes que só contêm a palavra", () => {
    expect(isIncompleteProfileName("Aluno WebStart 2")).toBe(false);
    expect(isIncompleteProfileName("WebStart")).toBe(false);
  });
});

describe("validateProfileName", () => {
  it("exige nome", () => {
    const result = validateProfileName("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("O nome é obrigatório.");
  });

  it("exige 2 a 60 caracteres, contados já sem espaços das pontas", () => {
    expect(validateProfileName("A").valid).toBe(false);
    expect(validateProfileName("  A  ").valid).toBe(false);
    expect(validateProfileName("Ana").valid).toBe(true);
    expect(validateProfileName("x".repeat(60)).valid).toBe(true);
    expect(validateProfileName("x".repeat(61)).valid).toBe(false);
  });

  it("recusa o default histórico com mensagem própria", () => {
    const result = validateProfileName("aluno webstart");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Aluno WebStart/);
    // a regra do default tem de bater antes da do tamanho, senão
    // "aluno webstart" (13 chars) passava como nome válido.
    expect(validateProfileName("X").error).not.toMatch(/Aluno WebStart/);
  });

  it("devolve o valor normalizado para gravar", () => {
    const result = validateProfileName("  Maria   Silva  ");
    expect(result.valid).toBe(true);
    expect(result.value).toBe("Maria Silva");
    expect(result.error).toBeNull();
  });

  it("um nome normalizado nunca é incomplete", () => {
    for (const raw of [" Maria Silva ", "  Ana  ", "Aluno WebStart"]) {
      const result = validateProfileName(raw);
      if (result.valid) expect(isIncompleteProfileName(result.value)).toBe(false);
    }
  });
});

describe("normalizeName", () => {
  it("colapsa espaços internos e apara as pontas", () => {
    expect(normalizeName("  Maria   Silva  ")).toBe("Maria Silva");
    expect(normalizeName("Maria\n\tSilva")).toBe("Maria Silva");
  });

  it("não rebenta com null/undefined", () => {
    expect(normalizeName(null)).toBe("");
    expect(normalizeName(undefined)).toBe("");
  });
});

describe("URLs", () => {
  it("addiciona o esquema em falta", () => {
    expect(normalizeUrl("github.com/maria")).toBe("https://github.com/maria");
    expect(normalizeUrl("  https://x.com/maria  ")).toBe("https://x.com/maria");
    expect(normalizeUrl("")).toBe("");
  });

  it("aceita vazio e http(s), rejeita o resto", () => {
    expect(isValidUrl("")).toBe(true);
    expect(isValidUrl(null)).toBe(true);
    expect(isValidUrl("github.com/maria")).toBe(true);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("não é uma url")).toBe(false);
  });
});

describe("validatePasswordChange", () => {
  it("aceita uma troca bem formada", () => {
    const result = validatePasswordChange({
      currentPassword: "antiga123",
      newPassword: "nova-super-segura",
      confirmPassword: "nova-super-segura",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("exige a senha atual", () => {
    const result = validatePasswordChange({
      currentPassword: "",
      newPassword: "nova-super-segura",
      confirmPassword: "nova-super-segura",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.currentPassword).toBe("A senha atual é obrigatória.");
  });

  it("exige 8 caracteres na nova senha", () => {
    const tooShort = validatePasswordChange({
      currentPassword: "antiga123",
      newPassword: "1234567",
      confirmPassword: "1234567",
    });
    expect(tooShort.valid).toBe(false);
    expect(tooShort.errors.newPassword).toMatch(/8 caracteres/);

    const exactly8 = validatePasswordChange({
      currentPassword: "antiga123",
      newPassword: "12345678",
      confirmPassword: "12345678",
    });
    expect(exactly8.valid).toBe(true);
  });

  it("exige confirmação e igualdade", () => {
    const missing = validatePasswordChange({
      currentPassword: "antiga123",
      newPassword: "nova-super-segura",
      confirmPassword: "",
    });
    expect(missing.valid).toBe(false);
    expect(missing.errors.confirmPassword).toBe("Confirma a nova senha.");

    const mismatch = validatePasswordChange({
      currentPassword: "antiga123",
      newPassword: "nova-super-segura",
      confirmPassword: "outra-coisa",
    });
    expect(mismatch.valid).toBe(false);
    expect(mismatch.errors.confirmPassword).toBe("As senhas não coincidem.");
  });

  it("não rebenta com argumentos vazios", () => {
    expect(validatePasswordChange().valid).toBe(false);
    expect(validatePasswordChange({}).errors.newPassword).toBeTruthy();
  });
});

describe("paridade JS/SQL da migração 017", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("o literal do default é o mesmo nos dois lados", () => {
    expect(sql).toContain(`'${DEFAULT_PROFILE_NAME}'`);
    expect(sql).toContain(`'${ANONYMOUS_DISPLAY_NAME}'`);
  });

  it("a função SQL existe e é imutável (dá para usar em views/índices)", () => {
    expect(sql).toMatch(/create or replace function public\.is_incomplete_profile_name\(p_name text\)/);
    expect(sql).toMatch(/is_incomplete_profile_name[\s\S]{0,200}?immutable/);
  });

  it("name ficou nullable e sem default", () => {
    expect(sql).toMatch(/alter table public\.profiles alter column name drop default/);
    expect(sql).toMatch(/alter table public\.profiles alter column name drop not null/);
  });

  it("o ranking passa a devolver o sinalizador de perfil público", () => {
    expect(sql).toMatch(/has_public_profile boolean/);
  });

  it("a migração NÃO normaliza as linhas existentes (decisão do produto)", () => {
    // Um `update public.profiles set name = null` aqui apagaria o estado
    // "ainda não escolheu nome" e seria irreversível.
    expect(sql).not.toMatch(/update\s+public\.profiles/i);
  });
});

describe("paridade JS/SQL da migração 018", () => {
  // A RPC repete as regras de `profileValidation.js` em SQL. Duas cópias da
  // mesma regra só se mantêm em sintonia se houver um teste a dizer que têm de
  // concordar — daí este bloco.
  const sql = readFileSync(MIGRATION_018_PATH, "utf8");

  it("os limites numéricos são os mesmos", () => {
    expect(sql).toContain(`char_length(v_name) < ${NAME_MIN}`);
    expect(sql).toContain(`char_length(v_name) > ${NAME_MAX}`);
    expect(sql).toContain(`char_length(v_bio) > ${BIO_MAX}`);
  });

  it("o nome passa pela mesma função de nome incompleto", () => {
    expect(sql).toMatch(/public\.is_incomplete_profile_name\(v_name\)/);
  });

  it("a URL tem de ser http(s), como em isValidUrl", () => {
    expect(sql).toMatch(/\^https\?:\/\/\[\^\[:space:\]\]\+\$/);
  });

  it("a RPC não é privileges-definer: quem escreve continua sujeito ao RLS", () => {
    // SECURITY DEFINER aqui seria abrir uma porta: a função correria com os
    // privilégios do dono e o RLS do UPDATE deixaria de se aplicar.
    const rpc = sql.slice(
      sql.indexOf("create or replace function public.update_own_profile"),
      sql.indexOf("comment on function public.update_own_profile"),
    );
    expect(rpc).toMatch(/security invoker/);
    expect(rpc).not.toMatch(/security definer/);
  });

  it("a whitelist da RPC é a whitelist do cliente", () => {
    for (const field of [
      "name",
      "bio",
      "is_public",
      "github_url",
      "portfolio_url",
      "linkedin_url",
      "twitter_url",
      "instagram_url",
      "website_url",
    ]) {
      expect(sql).toContain(`'${field}'`);
    }
    // E o cliente não escreve em nenhuma das três colunas privilegiadas.
    for (const forbidden of ["'role'", "'xp'", "'is_premium'", "'purchased_courses'"]) {
      expect(sql).not.toContain(`${forbidden},`);
    }
  });

  it("o trigger protege as três colunas de escalonamento de privilégios", () => {
    expect(sql).toMatch(
      /new\.role is distinct from old\.role[\s\S]*?new\.is_premium is distinct from old\.is_premium[\s\S]*?new\.purchased_courses is distinct from old\.purchased_courses/,
    );
    expect(sql).toMatch(/create trigger profiles_guard_privileged_columns[\s\S]*?before update on public\.profiles/);
  });

  it("a RPC só é executável por quem está autenticado", () => {
    expect(sql).toMatch(
      /revoke all on function public\.update_own_profile\(jsonb\) from public, anon/,
    );
    expect(sql).toMatch(
      /grant execute on function public\.update_own_profile\(jsonb\) to authenticated/,
    );
  });

  it("a migração é repetível (drop trigger if exists)", () => {
    expect(sql).toMatch(/drop trigger if exists profiles_guard_privileged_columns/);
  });
});
