import fs from 'node:fs';
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']+|["']+$/g, '');
}
const ak = env.VITE_SUPABASE_ANON_KEY;
const base = env.VITE_SUPABASE_URL.replace(/\/$/, '');
console.log('host:', new URL(base).host, '| jwt payload ref:', JSON.parse(Buffer.from(ak.split('.')[1], 'base64').toString()).ref);

const probe = async (name, url, headers) => {
  try {
    const r = await fetch(url, { headers });
    let body = '';
    try { body = (await r.text()).slice(0, 200).replace(/\n/g, ' '); } catch {}
    console.log(name.padEnd(34), 'HTTP', r.status, r.headers.get('content-range') ? 'range=' + r.headers.get('content-range') : '', body ? '| ' + body : '');
  } catch (e) { console.log(name.padEnd(34), 'ERRO', e.message); }
};

await probe('spec  (só apikey)', `${base}/rest/v1/`, { apikey: ak });
await probe('profiles (só apikey)', `${base}/rest/v1/profiles?select=id`, { apikey: ak });
await probe('courses (só apikey)', `${base}/rest/v1/courses?select=id`, { apikey: ak });
await probe('lessons (só apikey)', `${base}/rest/v1/lessons?select=id`, { apikey: ak });
await probe('profiles (apikey+Bearer)', `${base}/rest/v1/profiles?select=id`, { apikey: ak, Authorization: `Bearer ${ak}` });
