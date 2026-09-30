/**
 * In-memory Supabase double.
 *
 * It is NOT a happy-path mock: it reproduces the behaviours of the real stack
 * that the production code actually depends on, so that tests fail when those
 * behaviours break the app:
 *
 *  - PostgREST `maybeSingle()` semantics: 0 rows -> `{data:null,error:null}`,
 *    >1 rows -> error "JSON object requested, multiple (or no) rows returned"
 *    (code PGRST116). This is what breaks when a query's filter matches two
 *    different `profiles` rows for the same auth user.
 *  - RLS policies from supabase/migrations/003_rls.sql and 015
 *    (`profiles_select_self_or_public`, `learning_own`, `user_is_profile_owner`).
 *  - Foreign keys: `learning_profiles.user_id` -> `profiles.id`, etc. Writing an
 *    unknown profile id fails with PostgreSQL code 23503.
 *  - `link_legacy_profile()` as implemented in migration 011 (copy + never
 *    destructive), because that is what creates the "two profiles rows for one
 *    auth user" state.
 *  - GoTrue-ish `auth` with INITIAL_SESSION / SIGNED_IN / SIGNED_OUT events.
 *  - Realtime channels (`postgres_changes`) that can be driven from tests.
 */

const MULTIPLE_ROWS_ERROR = {
  message: "JSON object requested, multiple (or no) rows returned",
  details: "Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row",
  hint: null,
  code: "PGRST116",
};

const NO_ROWS_ERROR = {
  message: "JSON object requested, multiple (or no) rows returned",
  details: "Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row",
  hint: null,
  code: "PGRST116",
};

export function postgrestError(message, code, details = null) {
  return { message, details, hint: null, code };
}

function fkError(table, column, value) {
  return postgrestError(
    `insert or update on table "${table}" violates foreign key constraint "${table}_${column}_fkey"`,
    "23503",
    `Key (${column})=(${value}) is not present in table "profiles".`,
  );
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export const DEFAULT_TABLES = () => ({
  profiles: [],
  learning_profiles: [],
  email_preferences: [],
  lesson_progress: [],
  quiz_completions: [],
  course_completions: [],
  user_achievements: [],
  xp_transactions: [],
  identity_links: [],
  courses: [],
  modules: [],
  lessons: [],
  achievements: [],
  community_projects: [],
  project_likes: [],
  project_comments: [],
  post_reports: [],
});

// Tables whose `user_id` is a FK to profiles.id (migrations 001 + 007).
const PROFILE_OWNED_TABLES = new Set([
  "learning_profiles",
  "email_preferences",
  "lesson_progress",
  "quiz_completions",
  "course_completions",
  "user_achievements",
  "xp_transactions",
  "identity_links",
]);

class QueryBuilder {
  constructor(client, table, operation) {
    this.client = client;
    this.table = table;
    this.operation = operation;
    this.filters = [];
    this.orderSpec = null;
    this.limitCount = null;
    this.payload = null;
    this.onConflict = null;
    this.returnSingle = null; // null | 'maybeSingle' | 'single'
  }

  select() {
    if (this.operation === "select") return this;
    this.returning = true;
    return this;
  }

  eq(column, value) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  in(column, values) {
    this.filters.push({ kind: "in", column, value: values });
    return this;
  }

  ilike(column, value) {
    this.filters.push({ kind: "ilike", column, value });
    return this;
  }

  not(column, operator, value) {
    this.filters.push({ kind: "not", column, operator, value });
    return this;
  }

  is(column, value) {
    this.filters.push({ kind: "is", column, value });
    return this;
  }

  or(expression) {
    this.filters.push({ kind: "or", expression });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderSpec = { column, ascending };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  insert(payload) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload, { onConflict } = {}) {
    this.operation = "upsert";
    this.payload = payload;
    this.onConflict = onConflict;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  maybeSingle() {
    this.returnSingle = "maybeSingle";
    return this;
  }

  single() {
    this.returnSingle = "single";
    return this;
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.execute().catch(onRejected);
  }

  finally(cb) {
    return this.execute().finally(cb);
  }

  rows() {
    return this.client.db[this.table];
  }

  applyFilters(rows) {
    let out = rows;
    for (const filter of this.filters) {
      out = out.filter((row) => this.matchFilter(row, filter));
    }
    return out;
  }

  matchFilter(row, filter) {
    switch (filter.kind) {
      case "eq":
        return row[filter.column] === filter.value;
      case "in":
        return filter.value.includes(row[filter.column]);
      case "ilike": {
        const actual = String(row[filter.column] ?? "").toLowerCase();
        return actual === String(filter.value).trim().toLowerCase();
      }
      case "is":
        return row[filter.column] === filter.value;
      case "not": {
        if (filter.operator === "is") {
          return filter.value === null
            ? row[filter.column] !== null && row[filter.column] !== undefined
            : row[filter.column] === filter.value;
        }
        return row[filter.column] !== filter.value;
      }
      case "or": {
        // Supports the subset of PostgREST `or` syntax used by the app:
        //   "id.eq.<uuid>,auth_user_id.eq.<uuid>"
        return filter.expression.split(",").some((part) => {
          const [column, operator, ...rest] = part.trim().split(".");
          const value = rest.join(".");
          const actual = row[column];
          if (operator === "eq") return String(actual) === value;
          if (operator === "is") {
            return value === "null" ? actual === null : actual === value;
          }
          if (operator === "neq") return String(actual) !== value;
          return false;
        });
      }
      default:
        return true;
    }
  }

  // ─── RLS (security filters) ────────────────────────────────────────────
  rlsFilter(rows, mode) {
    const uid = this.client.currentUserId();
    const profiles = this.client.db.profiles;
    const isAdmin = this.client.isAdmin();

    if (this.table === "profiles") {
      if (mode === "write") {
        return rows.filter(
          (row) => row.id === uid || row.auth_user_id === uid || isAdmin,
        );
      }
      return rows.filter(
        (row) =>
          row.id === uid ||
          row.auth_user_id === uid ||
          row.is_public === true ||
          isAdmin,
      );
    }

    if (PROFILE_OWNED_TABLES.has(this.table)) {
      const ownerColumn = this.table === "identity_links" ? "auth_uid" : "user_id";
      return rows.filter((row) => {
        if (isAdmin) return true;
        if (row[ownerColumn] === uid) return true;
        const owner = profiles.find((p) => p.id === row[ownerColumn]);
        return Boolean(owner && owner.auth_user_id === uid);
      });
    }

    if (this.table === "project_likes" || this.table === "project_comments") {
      return rows.filter(
        (row) => row.user_id === uid || row.author_id === uid || isAdmin,
      );
    }

    return rows;
  }

  fkCheck(table, row) {
    if (!PROFILE_OWNED_TABLES.has(table)) return null;
    const column = table === "identity_links" ? "auth_uid" : "user_id";
    if (row[column] == null) return null;
    if (table === "identity_links") return null;
    const exists = this.client.db.profiles.some((p) => p.id === row[column]);
    if (!exists) return fkError(table, column, row[column]);
    return null;
  }

  // ─── execution ────────────────────────────────────────────────────────
  async execute() {
    this.client.queries.push({
      table: this.table,
      operation: this.operation,
      filters: clone(this.filters),
    });
    this.client.queryCount = (this.client.queryCount || 0) + 1;
    if (this.table) {
      this.client.queryCountByTable = this.client.queryCountByTable || {};
      this.client.queryCountByTable[this.table] =
        (this.client.queryCountByTable[this.table] || 0) + 1;
    }

    const error = this.client.injectedError || this.client.persistentError;
    if (error) {
      this.client.injectedError = null;
      return { data: null, error, count: null, status: 400, statusText: "Bad Request" };
    }

    switch (this.operation) {
      case "select":
        return this.runSelect();
      case "insert":
        return this.runWrite("insert");
      case "upsert":
        return this.runWrite("upsert");
      case "update":
        return this.runWrite("update");
      case "delete":
        return this.runWrite("delete");
      default:
        return { data: null, error: postgrestError("unsupported operation", "PGRST100") };
    }
  }

  runSelect() {
    let rows = this.rlsFilter(this.applyFilters(this.rows()), "read");

    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      rows = [...rows].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av === bv) return 0;
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
      });
    }

    if (this.returnSingle) {
      // PostgREST: `Accept: application/vnd.pgrst.object+json` errors when the
      // result set is not exactly one row.
      if (rows.length > 1) {
        return { data: null, error: clone(MULTIPLE_ROWS_ERROR), count: null, status: 406 };
      }
      if (rows.length === 0) {
        if (this.returnSingle === "maybeSingle") {
          return { data: null, error: null, count: null, status: 200, statusText: "OK" };
        }
        return { data: null, error: clone(NO_ROWS_ERROR), count: null, status: 406 };
      }
      return { data: clone(rows[0]), error: null, count: 1, status: 200, statusText: "OK" };
    }

    if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
    return { data: clone(rows), error: null, count: rows.length, status: 200, statusText: "OK" };
  }

  runWrite(kind) {
    const table = this.table;
    const rows = this.rows();
    const payload = clone(this.payload);

    if (kind === "insert" || kind === "upsert") {
      const incoming = Array.isArray(payload) ? payload : [payload];
      const inserted = [];
      for (const row of incoming) {
        const fk = this.fkCheck(table, row);
        if (fk) return { data: null, error: fk, count: null, status: 409 };

        if (kind === "upsert") {
          const keys = (this.onConflict || "id").split(",").map((k) => k.trim());
          const existingIndex = rows.findIndex((existing) =>
            keys.every((key) => existing[key] === row[key]),
          );
          if (existingIndex >= 0) {
            rows[existingIndex] = { ...rows[existingIndex], ...row };
            inserted.push(rows[existingIndex]);
            continue;
          }
        }

        const duplicate = rows.find((existing) => {
          if (this.onConflict) {
            const keys = this.onConflict.split(",").map((k) => k.trim());
            return keys.every((key) => existing[key] === row[key]);
          }
          // Surrogate PK (profiles.id) or the table's single PK column
          const pkColumns = PRIMARY_KEYS[table];
          if (pkColumns) return pkColumns.every((key) => existing[key] === row[key]);
          return false;
        });

        if (duplicate) {
          return {
            data: null,
            error: postgrestError(
              `duplicate key value violates unique constraint "${table}_pkey"`,
              "23505",
            ),
            count: null,
            status: 409,
          };
        }

        rows.push(row);
        inserted.push(row);
      }
      this.client.emitRealtime(table, "INSERT", inserted);
      return { data: null, error: null, count: inserted.length, status: 201, statusText: "Created" };
    }

    if (kind === "update") {
      const visible = this.rlsFilter(this.applyFilters(rows), "write");
      if (visible.length === 0) {
        return { data: null, error: null, count: 0, status: 204, statusText: "No Content" };
      }
      const ids = new Set(visible);
      const updated = [];
      for (let i = 0; i < rows.length; i += 1) {
        if (!ids.has(rows[i])) continue;
        const fk = this.fkCheck(table, { ...rows[i], ...payload });
        if (fk) return { data: null, error: fk, count: null, status: 409 };
        rows[i] = { ...rows[i], ...payload };
        updated.push(rows[i]);
      }
      this.client.emitRealtime(table, "UPDATE", updated);
      return { data: null, error: null, count: updated.length, status: 200, statusText: "OK" };
    }

    // delete
    const visible = this.rlsFilter(this.applyFilters(rows), "write");
    const ids = new Set(visible);
    let removed = 0;
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if (ids.has(rows[i])) {
        rows.splice(i, 1);
        removed += 1;
      }
    }
    return { data: null, error: null, count: removed, status: 200, statusText: "OK" };
  }
}

// Primary keys used only to emulate unique-constraint violations.
const PRIMARY_KEYS = {
  profiles: ["id"],
  learning_profiles: ["user_id"],
  email_preferences: ["user_id"],
  identity_links: ["auth_uid"],
  lesson_progress: ["user_id", "lesson_id"],
  quiz_completions: ["user_id", "module_id"],
  course_completions: ["user_id", "course_id"],
  user_achievements: ["user_id", "achievement_id"],
};

class FakeChannel {
  constructor(client, name) {
    this.client = client;
    this.name = name;
    this.bindings = [];
    this.status = "CLOSED";
    this.subscribed = false;
  }

  on(event, filter, callback) {
    this.bindings.push({ event, filter, callback });
    return this;
  }

  subscribe(callback) {
    this.subscribed = true;
    this.status = "SUBSCRIBED";
    if (callback) callback("SUBSCRIBED");
    return this;
  }

  unsubscribe() {
    this.subscribed = false;
    this.status = "CLOSED";
    this.client.channels.delete(this.name);
    return Promise.resolve("ok");
  }
}

class FakeAuth {
  constructor(client) {
    this.client = client;
  }

  getSession() {
    return Promise.resolve({
      data: { session: this.client.session },
      error: null,
    });
  }

  getUser() {
    return Promise.resolve({ data: { user: this.client.session?.user ?? null }, error: null });
  }

  signInWithPassword({ email, password }) {
    const record = this.client.authUsers.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase(),
    );
    if (!record || record.password !== password) {
      return Promise.resolve({
        data: { user: null, session: null },
        error: {
          name: "AuthApiError",
          message: "Invalid login credentials",
          code: "invalid_credentials",
          status: 400,
        },
      });
    }
    const session = { user: stripPassword(record), access_token: "token", expires_at: 0 };
    this.client.session = session;
    this.client.emitAuth("SIGNED_IN", session);
    return Promise.resolve({ data: { user: session.user, session }, error: null });
  }

  signUp({ email, password, options }) {
    const existing = this.client.authUsers.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase(),
    );
    if (existing) {
      return Promise.resolve({
        data: { user: null, session: null },
        error: {
          name: "AuthApiError",
          message: "User already registered",
          code: "email_already-in-use",
          status: 422,
        },
      });
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      password,
      user_metadata: { name: options?.data?.name, provider: options?.data?.provider },
      app_metadata: { providers: [options?.data?.provider || "email"] },
    };
    this.client.authUsers.push(user);
    const session = { user: stripPassword(user), access_token: "token", expires_at: 0 };
    this.client.session = session;
    this.client.emitAuth("SIGNED_IN", session);
    return Promise.resolve({ data: { user: session.user, session }, error: null });
  }

  signOut() {
    this.client.session = null;
    this.client.emitAuth("SIGNED_OUT", null);
    return Promise.resolve({ error: null });
  }

  signInWithOAuth({ provider }) {
    this.client.lastOAuthProvider = provider;
    return Promise.resolve({ data: { provider, url: "https://oauth.test" }, error: null });
  }

  onAuthStateChange(callback) {
    const entry = { callback };
    this.client.authListeners.add(entry);
    // Supabase emits INITIAL_SESSION right after subscribing, with `null` when
    // there is no persisted session.
    if (this.client.session) {
      callback("INITIAL_SESSION", this.client.session);
    } else {
      callback("INITIAL_SESSION", null);
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => this.client.authListeners.delete(entry),
        },
      },
    };
  }
}

function stripPassword(user) {
  const rest = { ...user };
  delete rest.password;
  return clone(rest);
}

export class FakeSupabase {
  constructor({ tables, authUsers = [], session = null, adminIds = [] } = {}) {
    this.db = tables ? { ...DEFAULT_TABLES(), ...clone(tables) } : DEFAULT_TABLES();
    this.authUsers = clone(authUsers);
    this.session = session;
    this.adminIds = new Set(adminIds);
    this.authListeners = new Set();
    this.channels = new Map();
    this.queries = [];
    this.injectedError = null;
    this.auth = new FakeAuth(this);
    this.lastOAuthProvider = null;
  }

  currentUserId() {
    return this.session?.user?.id ?? null;
  }

  isAdmin() {
    const uid = this.currentUserId();
    if (!uid) return false;
    if (this.adminIds.has(uid)) return true;
    const row = this.db.profiles.find(
      (p) => p.id === uid || p.auth_user_id === uid,
    );
    return row?.role === "admin";
  }

  from(table) {
    if (!Object.prototype.hasOwnProperty.call(this.db, table)) {
      throw new Error(`fake supabase: unknown table "${table}"`);
    }
    return new QueryBuilder(this, table, "select");
  }

  rpc(fnName, args = {}) {
    this.rpcCalls = this.rpcCalls || [];
    this.rpcCalls.push({ fnName, args });
    if (this.rpcErrors && this.rpcErrors[fnName]) {
      const error = this.rpcErrors[fnName];
      delete this.rpcErrors[fnName];
      return Promise.reject(error);
    }
    if (fnName !== "link_legacy_profile") {
      return Promise.resolve({ data: null, error: postgrestError(`unknown function ${fnName}`, "42883") });
    }
    return Promise.resolve({ data: this.linkLegacyProfile(args), error: null });
  }

  /**
   * Mirror of public.link_legacy_profile (supabase/migrations/011_*.sql).
   * Copy + never destructive; creates the "work profile" row at p_auth_uid.
   */
  linkLegacyProfile({ p_auth_uid: pAuthUid, p_firebase_uid: pFirebaseUid }) {
    const db = this.db;
    let legacy = null;

    if (pFirebaseUid) {
      legacy = db.profiles.find((p) => p.legacy_firebase_uid === pFirebaseUid) ?? null;
    }

    if (!legacy) {
      const authUser = this.authUsers.find((u) => u.id === pAuthUid);
      const email = authUser?.email;
      if (email) {
        const candidates = db.profiles
          .filter((p) => p.id !== pAuthUid && String(p.email || "").toLowerCase() === email.toLowerCase())
          .sort((a, b) => {
            if ((b.xp || 0) !== (a.xp || 0)) return (b.xp || 0) - (a.xp || 0);
            return String(a.created_at || "").localeCompare(String(b.created_at || ""));
          });
        legacy = candidates[0] ?? null;
      }
    }

    if (!legacy) return pAuthUid;
    if (legacy.auth_user_id && legacy.auth_user_id !== pAuthUid) return pAuthUid;

    let username = legacy.username;
    if (
      username &&
      db.profiles.some((p) => p.username === username && p.id !== pAuthUid)
    ) {
      username = `${username.slice(0, 80)}-${pAuthUid.replace(/-/g, "").slice(0, 8)}`;
    }

    const copy = {
      ...clone(legacy),
      id: pAuthUid,
      legacy_firebase_uid: null,
      username,
      auth_user_id: null,
      last_login: new Date().toISOString(),
    };

    const existing = db.profiles.find((p) => p.id === pAuthUid);
    if (existing) {
      const isEmptyWorkProfile =
        (existing.xp || 0) === 0 &&
        (existing.completed_lessons || []).length === 0 &&
        (existing.completed_courses || []).length === 0;
      if (isEmptyWorkProfile) {
        Object.assign(existing, copy);
      }
    } else {
      db.profiles.push(copy);
    }

    for (const [table, keys] of [
      ["lesson_progress", ["lesson_id"]],
      ["quiz_completions", ["module_id"]],
      ["course_completions", ["course_id"]],
      ["user_achievements", ["achievement_id"]],
      ["learning_profiles", []],
      ["email_preferences", []],
    ]) {
      for (const child of db[table].filter((row) => row.user_id === legacy.id)) {
        const alreadyThere = db[table].some((row) =>
          keys.every((key) => row[key] === child[key]),
        );
        if (alreadyThere) continue;
        db[table].push({ ...clone(child), user_id: pAuthUid });
      }
    }

    const legacyRow = db.profiles.find((p) => p.id === legacy.id);
    if (legacyRow && !legacyRow.auth_user_id) legacyRow.auth_user_id = pAuthUid;

    const link = db.identity_links.find((row) => row.auth_uid === pAuthUid);
    if (link) {
      link.source_profile_id = legacy.id;
      link.legacy_firebase_uid = legacyRow?.legacy_firebase_uid ?? null;
    } else {
      db.identity_links.push({
        auth_uid: pAuthUid,
        source_profile_id: legacy.id,
        legacy_firebase_uid: legacyRow?.legacy_firebase_uid ?? null,
        match_source: pFirebaseUid ? "firebase_uid" : "email",
      });
    }

    return pAuthUid;
  }

  channel(name) {
    const existing = this.channels.get(name);
    if (existing) return existing;
    const channel = new FakeChannel(this, name);
    this.channels.set(name, channel);
    return channel;
  }

  removeChannel(channel) {
    this.channels.delete(channel?.name);
    return Promise.resolve("ok");
  }

  emitAuth(event, session) {
    for (const { callback } of this.authListeners) callback(event, session);
  }

  emitRealtime(table, event, rows) {
    for (const channel of this.channels.values()) {
      if (!channel.subscribed) continue;
      for (const binding of channel.bindings) {
        if (binding.event !== "postgres_changes") continue;
        if (binding.filter?.schema && binding.filter.schema !== "public") continue;
        if (binding.filter?.table && binding.filter.table !== table) continue;
        for (const row of rows) {
          if (binding.filter?.filter) {
            const [column, operator, value] = binding.filter.filter.split(/[=.]+/);
            if (operator === "eq" && String(row[column]) !== value) continue;
          }
          binding.callback({ eventType: event.toLowerCase(), new: row, old: {}, table });
        }
      }
    }
  }

  // ─── test helpers ──────────────────────────────────────────────────────
  /** One-shot error: the next query fails, later ones succeed. */
  injectError(error) {
    this.injectedError = error;
  }

  /** Persistent outage: every query fails until cleared. */
  setError(error) {
    this.persistentError = error;
  }

  clearError() {
    this.persistentError = null;
    this.injectedError = null;
  }

  failRpc(fnName, error) {
    this.rpcErrors = this.rpcErrors || {};
    this.rpcErrors[fnName] = error;
  }

  setSession(user) {
    this.session = user ? { user, access_token: "token" } : null;
  }

  profileById(id) {
    return this.db.profiles.find((p) => p.id === id) ?? null;
  }

  /** Total de queries executadas (todas as tabelas). */
  queriesRun() {
    return this.queryCount || 0;
  }

  /** Queries executadas contra uma tabela específica. */
  queriesOn(table) {
    return this.queryCountByTable?.[table] || 0;
  }
}

export function createFakeSupabase(options) {
  return new FakeSupabase(options);
}

export function makeAuthUser({ id, email, password = "senha123", name, provider = "email" }) {
  return {
    id,
    email,
    password,
    user_metadata: { name, provider },
    app_metadata: { providers: [provider] },
  };
}

export function makeProfile(overrides = {}) {
  const id = overrides.id || crypto.randomUUID();
  return {
    id,
    legacy_firebase_uid: null,
    auth_user_id: null,
    name: "Aluna Teste",
    username: `aluna${id.slice(0, 6)}`,
    email: "aluna@webstart.test",
    provider: "email",
    role: "student",
    photo_url: null,
    xp: 0,
    level: 1,
    streak: 0,
    last_study_date: null,
    completed_exercises: 0,
    completed_projects: 0,
    current_course: null,
    current_lesson: null,
    total_study_time: 0,
    is_public: true,
    first_steps_done: false,
    created_at: "2024-01-01T00:00:00.000Z",
    last_login: null,
    welcome_email_sent: false,
    welcome_email_sent_at: null,
    last_reactivation_email: null,
    certificates: [],
    is_premium: false,
    purchased_courses: [],
    completed_lessons: [],
    completed_courses: [],
    completed_quizzes: [],
    github_url: null,
    portfolio_url: null,
    linkedin_url: null,
    twitter_url: null,
    instagram_url: null,
    website_url: null,
    bio: null,
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function learningProfileRow(
  userId,
  { completed = true, assessment = {}, roadmap = {}, metadataCompleted, metadata } = {},
) {
  const resolvedMetadataCompleted =
    metadataCompleted === undefined ? completed : metadataCompleted;
  return {
    user_id: userId,
    assessment,
    roadmap,
    metadata:
      metadata ??
      (resolvedMetadataCompleted
        ? {
            completed: true,
            version: 1,
            source: "signup",
            createdAt: "2024-05-01T00:00:00.000Z",
            updatedAt: "2024-05-01T00:00:00.000Z",
          }
        : { completed: false, version: 1, source: "signup" }),
    // Canonical column declared in 001_initial_schema.sql
    completed,
    source: "signup",
    created_at: "2024-05-01T00:00:00.000Z",
    updated_at: "2024-05-01T00:00:00.000Z",
  };
}
