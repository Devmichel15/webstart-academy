import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url),
);
const admin = requireFromFunctions('firebase-admin');

function loadEnv() {
  const raw = readFileSync('.env', 'utf8');
  const vars = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

const BASE = 'https://firestore.googleapis.com/v1';

function fieldsOf(payload) {
  const { __forceNull = [], ...rest } = payload;
  const fields = {};
  for (const [k, v] of Object.entries(rest)) {
    if (__forceNull.includes(k)) fields[k] = { nullValue: null };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    else if (Array.isArray(v))
      fields[k] = { arrayValue: { values: v.map((t) => ({ stringValue: t })) } };
    else fields[k] = { stringValue: v };
  }
  return { fields };
}

async function main() {
  const env = loadEnv();
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;

  const serviceAccount = JSON.parse(readFileSync('firebase/serviceAccountKey.json', 'utf8'));
  const adminApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const uid = `rules-probe-${Date.now()}`;
  const customToken = await admin.auth().createCustomToken(uid);
  const signIn = await (
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    )
  ).json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${signIn.idToken}`,
  };

  const base = {
    title: 'Probe Weather App',
    description: 'Descricao suficientemente longa para validar.',
    projectUrl: 'https://weather-app.vercel.app',
    tags: ['javascript', 'api'],
    authorId: uid,
    likeCount: 0,
    commentCount: 0,
  };

  const cases = [
    ['P1 baseline', base],
    ['P2 tags vazias []', { ...base, tags: [] }],
    ['P3 sem campo tags', (() => { const c = { ...base }; delete c.tags; return c; })()],
    ['P4 so githubUrl', (() => { const c = { ...base }; delete c.projectUrl; c.githubUrl = 'https://github.com/alice/repo'; return c; })()],
    ['P5 tag curta "js"', { ...base, tags: ['js'] }],
    ['P6 NEG likeCount=1', { ...base, likeCount: 1 }],
    ['P7 NEG authorId alheio', { ...base, authorId: 'outra-pessoa' }],
    ['P8 url http simples https://a.b/cd', { ...base, projectUrl: 'https://a.b/cd' }],
    ['P9 NEG tag 1 char', { ...base, tags: ['x'] }],
    ['P10 NEG tag 30 chars', { ...base, tags: ['a'.repeat(30)] }],
    ['P11 NEG 9 tags', { ...base, tags: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii'] }],
    ['P12 NEG url null explicito', { ...base, __forceNull: ['githubUrl'] }],
  ];

  for (const [label, payload] of cases) {
    const expectDeny = /^(P6|P7|P9|P10|P11|P12)/.test(label);
    const res = await fetch(
      `${BASE}/projects/${projectId}/databases/(default)/documents/community_projects`,
      { method: 'POST', headers, body: JSON.stringify(fieldsOf(payload)) },
    );
    const body = await res.json().catch(() => null);
    const allowed = res.ok;
    let verdict;
    if (expectDeny) verdict = allowed ? '⚠️ INESPERADO (permitiu)' : 'OK negado';
    else verdict = allowed ? 'OK permitido' : `negado`;
    console.log(`${verdict.padEnd(22)} ${label}`);
    if (!allowed && !expectDeny) {
      console.log(`   -> ${body?.error?.message?.slice(0, 120)}`);
    }
    if (allowed && body?.name) {
      await fetch(`${BASE}/${body.name}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${signIn.idToken}` },
      });
    }
  }

  await admin.auth().deleteUser(uid);
  console.log('\ncleanup feito');
  await adminApp.delete();
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exitCode = 1;
});
