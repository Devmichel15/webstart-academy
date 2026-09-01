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

async function main() {
  const env = loadEnv();
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;

  const serviceAccount = JSON.parse(readFileSync('firebase/serviceAccountKey.json', 'utf8'));
  const adminApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const uid = `rules-probe-${Date.now()}`;
  const customToken = await admin.auth().createCustomToken(uid);

  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const signIn = await signInRes.json();
  if (!signIn.idToken) {
    throw new Error(`signIn falhou: ${JSON.stringify(signIn)}`);
  }
  console.log(`autenticado: ${uid}\n`);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${signIn.idToken}`,
  };

  async function report(label, res, body) {
    if (res.ok) {
      console.log(`OK     ${label}`);
    } else {
      const detail =
        body?.error?.message?.slice(0, 300) || `${res.status} ${res.statusText}`;
      console.log(`DENIED ${label}\n       -> ${detail}`);
    }
    return res.ok;
  }

  let createdPath = null;

  // T1: criar projeto (payload equivalente ao cliente)
  {
    const url = `${BASE}/projects/${projectId}/databases/(default)/documents/community_projects`;
    const payload = {
      fields: {
        title: { stringValue: 'Probe Weather App' },
        description: { stringValue: 'Descricao suficientemente longa para validar.' },
        projectUrl: { stringValue: 'https://weather-app.vercel.app' },
        githubUrl: { nullValue: null },
        tags: {
          arrayValue: { values: [{ stringValue: 'javascript' }, { stringValue: 'api' }] },
        },
        authorId: { stringValue: uid },
        likeCount: { integerValue: 0 },
        commentCount: { integerValue: 0 },
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    const ok = await report('T1 create community_projects', res, body);
    if (ok && body?.name) createdPath = body.name;
  }

  // T2: ler feed (runQuery orderBy createdAt desc limit 9)
  {
    const url = `${BASE}/projects/${projectId}/databases/(default)/documents:runQuery`;
    const structuredQuery = {
      structuredQuery: {
        from: [{ collectionId: 'community_projects' }],
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: 9,
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(structuredQuery),
    });
    const body = await res.json().catch(() => null);
    await report('T2 read feed', res, body);
  }

  // T3: users documentId-in (hydrateAuthors)
  {
    const url = `${BASE}/projects/${projectId}/databases/(default)/documents:runQuery`;
    const structuredQuery = {
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: '__name__' },
            op: 'IN',
            value: { referenceValue: `projects/${projectId}/databases/(default)/documents/users/${uid}` },
          },
        },
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(structuredQuery),
    });
    const body = await res.json().catch(() => null);
    await report('T3 users __name__ IN proprio uid', res, body);
  }

  if (createdPath) {
    const del = await fetch(`${BASE}/${createdPath}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${signIn.idToken}` },
    });
    console.log(del.ok ? '\ncleanup: doc probe removido' : `\ncleanup falhou: ${del.status}`);
  }

  await admin.auth().deleteUser(uid);
  console.log('cleanup: utilizador sintetico removido');
  await adminApp.delete();
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exitCode = 1;
});
