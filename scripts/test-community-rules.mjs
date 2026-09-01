import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import { setDoc, doc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

const rules = readFileSync('firebase/firestore.rules', 'utf8')

let env
let failures = 0

function check(name, condition, extra = '') {
  if (condition) {
    console.log(`PASS ${name}`)
  } else {
    failures++
    console.log(`FAIL ${name} ${extra}`)
  }
}

async function main() {
  env = await initializeTestEnvironment({
    projectId: 'demo-community-test',
    firestore: { rules },
  })

  const alice = env.authenticatedContext('alice-uid')
  const aliceDb = alice.firestore()

  const baseForm = {
    title: 'Weather App',
    description: 'Meu primeiro projeto utilizando uma API externa para obter informacoes do clima.',
    projectUrl: 'https://weather-app.vercel.app',
    githubUrl: null,
    tags: ['javascript', 'api'],
    authorId: 'alice-uid',
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  // T1: payload completo (o que o cliente envia num formulario tipico)
  try {
    await assertSucceeds(
      setDoc(doc(collection(aliceDb, 'community_projects')), baseForm),
    )
    check('T1 create com tags e projectUrl', true)
  } catch (err) {
    check('T1 create com tags e projectUrl', false, `-> ${err.message}`)
  }

  // T2: sem tags (lista vazia) e apenas githubUrl
  const t2 = {
    title: 'Outro App',
    description: 'Descricao suficientemente longa para passar validacao.',
    projectUrl: null,
    githubUrl: 'https://github.com/alice/repo',
    tags: [],
  }
  try {
    await assertSucceeds(
      setDoc(doc(collection(aliceDb, 'community_projects')), {
        ...t2,
        authorId: 'alice-uid',
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
    check('T2 create sem tags e so githubUrl', true)
  } catch (err) {
    check('T2 create sem tags e so githubUrl', false, `-> ${err.message}`)
  }

  // T3: autor diferente do auth.uid deve falhar
  try {
    await assertFails(
      setDoc(doc(collection(aliceDb, 'community_projects')), {
        ...baseForm,
        authorId: 'mallory-uid',
      }),
    )
    check('T3 create com authorId alheio negado', true)
  } catch (err) {
    check('T3 create com authorId alheio negado', false, `-> ${err.message}`)
  }

  // T4: hydrateAuthors — listar users por documentId in (mesmo uid)
  try {
    await assertSucceeds(
      getDocs(query(collection(aliceDb, 'users'), where('__name__', 'in', ['alice-uid']))),
    )
    check('T4 list users documentId-in proprio uid', true)
  } catch (err) {
    check('T4 list users documentId-in proprio uid', false, `-> ${err.message}`)
  }

  // T5: feed orderBy createdAt desc limit 9
  try {
    await assertSucceeds(
      getDocs(query(collection(aliceDb, 'community_projects'))),
    )
    check('T5 read feed', true)
  } catch (err) {
    check('T5 read feed', false, `-> ${err.message}`)
  }

  // T6: serverTimestamp() real (sem strip) — replicar exatamente o cliente
  try {
    await assertSucceeds(
      setDoc(doc(collection(aliceDb, 'community_projects')), {
        title: 'App Server Ts',
        description: 'Descricao com mais de dez caracteres.',
        projectUrl: null,
        githubUrl: 'https://github.com/a/b',
        tags: ['x1', 'y2'],
        authorId: 'alice-uid',
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
    check('T6 create com serverTimestamp nativo', true)
  } catch (err) {
    check('T6 create com serverTimestamp nativo', false, `-> ${err.message}`)
  }
}

main()
  .catch((err) => {
    console.error('FATAL', err)
    process.exitCode = 1
  })
  .finally(async () => {
    if (env) await env.cleanup()
  })
