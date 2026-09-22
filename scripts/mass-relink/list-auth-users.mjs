import { createClient } from '@supabase/supabase-js';
import { loadMigrationEnv } from './_env.mjs';
const ENV = loadMigrationEnv();
const db = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

for (let page = 1; page <= 3; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error(`page ${page} error:`, error.message); break; }
  console.log(`page ${page}: ${data?.users?.length ?? 0} users, total=${data?.total ?? '?'} aud=${data?.aud ?? '?'}`);
  if ((data?.users?.length ?? 0) < 1000) break;
}
const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (!error) {
  console.log('\nAll users:');
  for (const u of data.users) console.log(`  ${u.id}  ${u.email}  created=${(u.created_at||'').slice(0,16)} last=${(u.last_sign_in_at||'').slice(0,16)}`);
}