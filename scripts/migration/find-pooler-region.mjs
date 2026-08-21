// Descobre a região do pooler Supabase resolvendo DNS dos candidatos.
import { resolve4 } from 'node:dns/promises';

const REGIONS = ['sa-east-1', 'us-east-1', 'us-west-1', 'us-west-2', 'eu-central-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ca-central-1'];

const found = [];
for (const r of REGIONS) {
  try {
    const ips = await resolve4(`aws-0-${r}.pooler.supabase.com`);
    found.push({ region: r, ip: ips[0] });
  } catch { /* região não existe ou sem resolução */ }
}
for (const f of found) console.log(`${f.region.padEnd(16)} → ${f.ip}`);
console.log(found.length ? `\n✓ ${found.length} regiões resolvem` : '\n✗ nenhuma região resolvou');
