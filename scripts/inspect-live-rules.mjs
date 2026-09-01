import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url),
);
const { GoogleAuth } = requireFromFunctions('google-auth-library');

const auth = new GoogleAuth({
  keyFile: 'firebase/serviceAccountKey.json',
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
});

const client = await auth.getClient();
const accessToken = (await client.getAccessToken()).token;

const projectId = 'webstart-afce3';
const headers = { Authorization: `Bearer ${accessToken}` };

// 1. release ativa para cloud.firestore
const relRes = await fetch(
  `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
  { headers },
);
const release = await relRes.json();
console.log('release:', JSON.stringify(release, null, 2).slice(0, 400));

const rulesetName = release.rulesetName;
if (!rulesetName) process.exit(1);

// 2. fonte do ruleset ativo
const rsRes = await fetch(`https://firebaserules.googleapis.com/v1/${rulesetName}`, { headers });
const ruleset = await rsRes.json();

for (const file of ruleset.source?.files ?? []) {
  const content = file.content ?? '';
  const hasCommunity = content.includes('community_projects');
  console.log(`\n=== ${file.name} | bytes=${content.length} | tem community_projects=${hasCommunity}`);
  console.log(content.split('\n').slice(0, 12).join('\n'));
  if (hasCommunity) {
    const idx = content.indexOf('community_projects');
    console.log('...\n' + content.slice(Math.max(0, idx - 200), idx + 400));
  }
}
