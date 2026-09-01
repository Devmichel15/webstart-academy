/**
 * Firebase → Supabase Community Data Migration Script
 *
 * This script exports community data from Firestore and imports it into Supabase.
 * Run AFTER the Supabase community tables (005_community_feed.sql) are created.
 *
 * Usage:
 *   node migration/import-community.js
 *
 * Environment:
 *   FIREBASE_SERVICE_ACCOUNT_KEY  - Base64 encoded Firebase service account JSON
 *   SUPABASE_URL                  - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key
 */

const { initializeApp, cert, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { createClient } = require('@supabase/supabase-js')

// ─── Config ────────────────────────────────────────────────────────
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'webstart-academy-9kkhl'
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cawoavdletnngyhrtzao.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// ─── Firebase Admin Init ───────────────────────────────────────────
let app
try {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccountB64) {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'))
    app = initializeApp({ credential: cert(serviceAccount), projectId: FIREBASE_PROJECT_ID })
  } else {
    app = initializeApp({ credential: applicationDefault(), projectId: FIREBASE_PROJECT_ID })
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin:', err.message)
  process.exit(1)
}

const db = getFirestore(app)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Helpers ───────────────────────────────────────────────────────
async function fetchFirestoreCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

function mapProjectFromFirestore(doc) {
  return {
    id: doc.id,
    title: doc.title || '',
    description: doc.description || '',
    tags: doc.tags || [],
    project_url: doc.projectUrl || null,
    github_url: doc.githubUrl || null,
    author_id: doc.authorId || doc.userId || '',
    like_count: doc.likeCount || 0,
    comment_count: doc.commentCount || 0,
    created_at: doc.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updated_at: doc.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }
}

function mapLikeFromFirestore(doc) {
  return {
    project_id: doc.projectId || '',
    user_id: doc.userId || '',
    created_at: doc.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }
}

function mapCommentFromFirestore(doc) {
  return {
    id: doc.id,
    project_id: doc.projectId || '',
    author_id: doc.authorId || doc.userId || '',
    content: doc.content || '',
    created_at: doc.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updated_at: doc.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }
}

// ─── Main Migration ────────────────────────────────────────────────
async function migrateCommunityData() {
  console.log('═══ Starting Community Data Migration ═══\n')

  // 1. Fetch from Firestore
  console.log('1. Fetching community_projects from Firestore...')
  const fsProjects = await fetchFirestoreCollection('community_projects')
  console.log(`   Found ${fsProjects.length} projects`)

  console.log('2. Fetching project_likes from Firestore...')
  const fsLikes = await fetchFirestoreCollection('project_likes')
  console.log(`   Found ${fsLikes.length} likes`)

  console.log('3. Fetching project_comments from Firestore...')
  const fsComments = await fetchFirestoreCollection('project_comments')
  console.log(`   Found ${fsComments.length} comments\n`)

  // 2. Map to Supabase format
  const supabaseProjects = fsProjects.map(mapProjectFromFirestore)
  const supabaseLikes = fsLikes.map(mapLikeFromFirestore)
  const supabaseComments = fsComments.map(mapCommentFromFirestore)

  // 3. Import into Supabase (in order: projects first, then likes/comments)
  console.log('4. Importing projects into Supabase...')
  if (supabaseProjects.length > 0) {
    const { data, error } = await supabase
      .from('community_projects')
      .upsert(supabaseProjects, { onConflict: 'id' })
    if (error) {
      console.error('   Error importing projects:', error.message)
    } else {
      console.log(`   ✓ Imported ${supabaseProjects.length} projects`)
    }
  }

  console.log('5. Importing likes into Supabase...')
  if (supabaseLikes.length > 0) {
    // Import in batches of 100
    for (let i = 0; i < supabaseLikes.length; i += 100) {
      const batch = supabaseLikes.slice(i, i + 100)
      const { error } = await supabase
        .from('project_likes')
        .upsert(batch, { onConflict: 'project_id,user_id' })
      if (error) {
        console.error(`   Error importing likes batch ${i}:`, error.message)
      }
    }
    console.log(`   ✓ Imported ${supabaseLikes.length} likes`)
  }

  console.log('6. Importing comments into Supabase...')
  if (supabaseComments.length > 0) {
    const { error } = await supabase
      .from('project_comments')
      .upsert(supabaseComments, { onConflict: 'id' })
    if (error) {
      console.error('   Error importing comments:', error.message)
    } else {
      console.log(`   ✓ Imported ${supabaseComments.length} comments`)
    }
  }

  // 4. Validate counters
  console.log('\n7. Validating project counters...')
  const { data: projects } = await supabase
    .from('community_projects')
    .select('id, like_count, comment_count')

  let mismatches = 0
  for (const p of projects || []) {
    const { count: actualLikes } = await supabase
      .from('project_likes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', p.id)

    const { count: actualComments } = await supabase
      .from('project_comments')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', p.id)

    if (p.like_count !== actualLikes || p.comment_count !== actualComments) {
      mismatches++
      await supabase
        .from('community_projects')
        .update({ like_count: actualLikes, comment_count: actualComments })
        .eq('id', p.id)
    }
  }

  console.log(`   Fixed ${mismatches} mismatched counters`)
  console.log('\n═══ Community Migration Complete ═══')
  console.log(`Summary:`)
  console.log(`  Projects: ${supabaseProjects.length}`)
  console.log(`  Likes: ${supabaseLikes.length}`)
  console.log(`  Comments: ${supabaseComments.length}`)
}

migrateCommunityData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
