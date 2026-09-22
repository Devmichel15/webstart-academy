import { createClient } from '@supabase/supabase-js';
import { loadMigrationEnv } from './_env.mjs';

const ENV = loadMigrationEnv();
const db = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ids = [
  'b5314114-731b-5940-ac9e-bd54e9f1dbaf',
  '1772b10b-6e3c-4d2d-a9d3-3f4952ccbddc',
  '30ae3657-721e-4602-973d-cb4628fb4f32',
  'b449892c-7fe1-495c-8c7f-a57d8c8209bf',
];

for (const id of ids) {
  const { data, error } = await db.from('profiles').select('*').eq('id', id);
  console.log(`id=${id} →`, error ? `ERR ${error.message}` : (data?.length ? JSON.stringify({ id: data[0].id, email: data[0].email, name: data[0].name, xp: data[0].xp, auth: data[0].auth_user_id, legacy: data[0].legacy_firebase_uid }) : 'NÃO EXISTE'));
}