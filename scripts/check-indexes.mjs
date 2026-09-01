import { execSync } from 'node:child_process';

const raw = execSync('npx firebase firestore:indexes --json', {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: true,
});

const start = raw.indexOf('{');
const json = raw.slice(start).trim();
console.error('RAW LENGTH:', raw.length);
try {
  const data = JSON.parse(json);
  console.error('TOP KEYS:', Object.keys(data));
  const list = data.result?.indexes ?? data.indexes ?? data;
  if (Array.isArray(list)) {
    for (const index of list) {
      const fields = (index.fields ?? []).map((f) => f.fieldPath).join(',');
      console.log(`${index.collectionGroup} (${fields}) -> ${index.state ?? index.state_ ?? JSON.stringify(Object.keys(index))}`);
    }
  } else {
    console.error('NOT ARRAY:', typeof list, JSON.stringify(list).slice(0, 300));
  }
} catch (err) {
  console.error('PARSE FAIL:', err.message);
  console.error(json.slice(0, 500));
}
