/**
 * Firebase → Supabase Cutover Plan
 *
 * This script handles the final cutover from Firebase to Supabase.
 * It should be run after:
 *   1. All Supabase migrations are applied
 *   2. All data has been migrated and validated
 *   3. All service files have been rewritten to use Supabase
 *   4. Community data migration is complete
 *
 * Usage:
 *   node migration/cutover.js --dry-run   # Preview changes
 *   node migration/cutover.js --execute   # Execute cutover
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cawoavdletnngyhrtzao.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const isDryRun = process.argv.includes('--dry-run')

// ─── Validation Checks ─────────────────────────────────────────────
async function validateMigration() {
  console.log('\n═══ Phase 1: Validation ═══\n')
  const checks = []

  // Check 1: All tables exist and have data
  const tables = ['profiles', 'courses', 'modules', 'lessons', 'achievements',
                   'lesson_progress', 'user_achievements', 'community_projects']

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    const status = error ? 'FAIL' : (count > 0 ? 'OK' : 'EMPTY')
    checks.push({ table, count: count || 0, status })
    console.log(`  ${status === 'OK' ? '✓' : status === 'EMPTY' ? '⚠' : '✗'} ${table}: ${count || 0} rows`)
  }

  // Check 2: No orphan foreign keys
  const { data: orphanProjects } = await supabase
    .rpc('check_orphan_projects') // This function should be created in migration

  if (orphanProjects && orphanProjects > 0) {
    console.log(`  ✗ Found ${orphanProjects} orphan projects`)
    checks.push({ table: 'orphan_projects', count: orphanProjects, status: 'FAIL' })
  }

  // Check 3: Auth users match profiles
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const { data: profiles } = await supabase.from('profiles').select('id')

  const authIds = new Set(authUsers?.users?.map(u => u.id) || [])
  const profileIds = new Set(profiles?.map(p => p.id) || [])

  const missingProfiles = authUsers?.users?.filter(u => !profileIds.has(u.id)) || []
  const orphanProfiles = profiles?.filter(p => !authIds.has(p.id)) || []

  console.log(`  ${missingProfiles.length === 0 ? '✓' : '✗'} Auth users without profiles: ${missingProfiles.length}`)
  console.log(`  ${orphanProfiles.length === 0 ? '✓' : '⚠'} Profiles without auth: ${orphanProfiles.length}`)

  const failed = checks.filter(c => c.status === 'FAIL')
  return {
    valid: failed.length === 0 && missingProfiles.length === 0,
    checks,
    missingProfiles: missingProfiles.map(u => u.id),
    orphanProfiles: orphanProfiles.map(p => p.id),
  }
}

// ─── Create Missing Profiles ───────────────────────────────────────
async function createMissingProfiles(missingIds) {
  console.log('\n═══ Phase 2: Create Missing Profiles ═══\n')

  for (const uid of missingIds) {
    const { data: authUser } = await supabase.auth.admin.getUserById(uid)
    if (!authUser?.user) continue

    const profile = {
      id: uid,
      name: authUser.user.user_metadata?.name || 'Migrated User',
      username: `user_${uid.slice(0, 8)}`,
      email: authUser.user.email || '',
      provider: authUser.user.app_metadata?.providers?.[0] || 'email',
      role: 'student',
      xp: 0,
      level: 1,
      streak: 0,
      is_public: true,
      first_steps_done: false,
    }

    if (!isDryRun) {
      const { error } = await supabase.from('profiles').insert(profile)
      if (error) {
        console.log(`  ✗ Failed to create profile for ${uid}: ${error.message}`)
      } else {
        console.log(`  ✓ Created profile for ${uid}`)
      }
    } else {
      console.log(`  [DRY RUN] Would create profile for ${uid}`)
    }
  }
}

// ─── Update Environment Config ─────────────────────────────────────
async function updateEnvConfig() {
  console.log('\n═══ Phase 3: Update Environment Config ═══\n')

  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.log('  ⚠ .env file not found, skipping')
    return
  }

  let envContent = fs.readFileSync(envPath, 'utf-8')

  // Add migration flag
  if (!envContent.includes('VITE_USE_SUPABASE')) {
    envContent += '\n# Firebase → Supabase Migration\nVITE_USE_SUPABASE=true\n'
    if (!isDryRun) {
      fs.writeFileSync(envPath, envContent)
      console.log('  ✓ Added VITE_USE_SUPABASE=true to .env')
    } else {
      console.log('  [DRY RUN] Would add VITE_USE_SUPABASE=true to .env')
    }
  } else {
    console.log('  ℹ VITE_USE_SUPABASE already set in .env')
  }
}

// ─── Generate Migration Report ─────────────────────────────────────
async function generateReport(validation) {
  console.log('\n═══ Phase 4: Migration Report ═══\n')

  const report = {
    timestamp: new Date().toISOString(),
    dryRun: isDryRun,
    validation,
    supabaseUrl: SUPABASE_URL,
    nextSteps: [
      '1. Run all Supabase migrations (005_community_feed.sql, 006_community_migration_validation.sql)',
      '2. Run import-community.js to migrate community data from Firestore',
      '3. Test the application thoroughly in staging',
      '4. Update DNS/deployment to point to new version',
      '5. Monitor for 24-48 hours',
      '6. Remove Firebase dependencies (npm uninstall firebase firebase-admin firebase-functions)',
      '7. Delete Firebase project (optional, keep for 30 days as backup)',
    ],
  }

  const reportPath = path.join(process.cwd(), 'migration', 'reports', 'cutover-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`  ✓ Report saved to ${reportPath}`)
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  WebStart Academy — Firebase → Supabase Cutover')
  console.log(`  Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`)
  console.log('═══════════════════════════════════════════════════════════════')

  const validation = await validateMigration()

  if (!validation.valid) {
    console.log('\n⚠ Migration validation failed. Fix issues before cutover.')
    if (validation.missingProfiles.length > 0) {
      await createMissingProfiles(validation.missingProfiles)
    }
  }

  await updateEnvConfig()
  await generateReport(validation)

  console.log('\n═══════════════════════════════════════════════════════════════')
  if (isDryRun) {
    console.log('  DRY RUN complete. Run with --execute to apply changes.')
  } else {
    console.log('  Cutover complete! Test the application thoroughly.')
  }
  console.log('═══════════════════════════════════════════════════════════════')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Cutover failed:', err)
    process.exit(1)
  })
