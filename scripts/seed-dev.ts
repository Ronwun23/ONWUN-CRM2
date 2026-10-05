// Fills the dev Supabase project with obviously-fake data so previews and
// local testing have something real-shaped to look at without ever risking
// production data. Every row this script creates is prefixed `[DEV]` and
// safe to wipe/re-run at any time — it deletes its own previous output
// before reinserting, rather than accumulating duplicates.
//
// Run with: npm run seed:dev
// (reads .env.seed-dev — see .env.seed-dev.example)

import { createClient } from '@supabase/supabase-js'

const DEV_PROJECT_REF = 'daedmhsejbpeaiwmqggr'
const SEED_TAG = '[DEV]'
const DOCUMENTS_BUCKET = 'documents'

// The two real team accounts (src/data/team.ts) — each gets an agency-role
// profile on the dev project so they can sign in and see the seeded data.
const TEAM_EMAILS = ['ro@onwun.com', 'niall@onwun.com']

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set them in .env.seed-dev')
}

// Structural safety guard, not just a careful convention: this script must
// be incapable of running against production even if the wrong env file
// gets passed by mistake.
if (!supabaseUrl.includes(DEV_PROJECT_REF)) {
  throw new Error(
    `Refusing to run — VITE_SUPABASE_URL (${supabaseUrl}) does not look like the dev project ` +
      `(expected it to contain "${DEV_PROJECT_REF}"). This script must never run against production.`
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

// A minimal, valid single-page PDF — just enough for a PDF viewer to open
// it without erroring, so a seeded document's signed URL actually resolves.
const PLACEHOLDER_PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Resources<<>>>>endobj',
    'trailer<</Root 1 0 R>>',
    '%%EOF',
  ].join('\n'),
  'utf-8'
)

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

interface SeedClientSpec {
  name: string
  projectName: string
  status: string
  owner: string
  startDate: string
  dueDate: string
  color: string
  initials: string
}

const CLIENT_SPECS: SeedClientSpec[] = [
  {
    name: `${SEED_TAG} Fictional Fizz Co.`,
    projectName: 'Brand Identity',
    status: 'active',
    owner: 'ro',
    startDate: daysFromNow(-5),
    dueDate: daysFromNow(40),
    color: '#6a60f6',
    initials: 'FF',
  },
  {
    name: `${SEED_TAG} Placeholder Pastries`,
    projectName: 'Social Media Management',
    status: 'active',
    owner: 'niall',
    startDate: daysFromNow(-30),
    dueDate: daysFromNow(15),
    color: '#eb6834',
    initials: 'PP',
  },
  {
    name: `${SEED_TAG} Testville Dental`,
    projectName: 'Website Redesign',
    status: 'active',
    owner: 'ro',
    startDate: daysFromNow(-60),
    dueDate: daysFromNow(5),
    color: '#1baf7a',
    initials: 'TD',
  },
  {
    name: `${SEED_TAG} Not-A-Real Gym`,
    projectName: 'Content Calendar',
    status: 'paused',
    owner: 'niall',
    startDate: daysFromNow(-90),
    dueDate: daysFromNow(-10),
    color: '#e87ba4',
    initials: 'NG',
  },
]

async function wipeExistingSeed() {
  console.log('Wiping previously seeded rows...')

  const { data: oldClients, error: findError } = await supabase
    .from('clients')
    .select('id')
    .like('name', `${SEED_TAG}%`)
  if (findError) throw findError

  if (oldClients && oldClients.length > 0) {
    const clientIds = oldClients.map((c) => c.id)

    // Storage objects aren't covered by the DB's cascade deletes.
    const { data: oldDocs } = await supabase.from('documents').select('url').in('client_id', clientIds)
    const storagePaths = (oldDocs ?? [])
      .map((d) => d.url as string | null)
      .filter((url): url is string => !!url?.startsWith('storage:'))
      .map((url) => url.slice('storage:'.length))
    if (storagePaths.length > 0) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove(storagePaths)
    }

    // Cascades to tasks/documents/document_comments/updates/brand_assets/library_folders.
    const { error: deleteError } = await supabase.from('clients').delete().in('id', clientIds)
    if (deleteError) throw deleteError
  }

  const { error: leadsError } = await supabase.from('leads').delete().like('company_name', `${SEED_TAG}%`)
  if (leadsError) throw leadsError
}

async function seedClients(): Promise<Map<string, number>> {
  console.log('Seeding clients...')
  const ids = new Map<string, number>()
  for (const spec of CLIENT_SPECS) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: spec.name,
        project_name: spec.projectName,
        initials: spec.initials,
        color: spec.color,
        status: spec.status,
        owner: spec.owner,
        start_date: spec.startDate,
        due_date: spec.dueDate,
        phases: [],
      })
      .select('id')
      .single()
    if (error) throw error
    ids.set(spec.name, data.id)
  }
  return ids
}

async function seedTasksFor(clientId: number, owner: string) {
  const tasks = [
    { title: 'Kickoff call', done: true, dueDate: daysFromNow(-20) },
    { title: 'Share brand questionnaire', done: true, dueDate: daysFromNow(-14) },
    { title: 'First draft review', done: false, dueDate: daysFromNow(-2) }, // overdue
    { title: 'Client feedback round', done: false, dueDate: daysFromNow(3) },
    { title: 'Final delivery', done: false, dueDate: daysFromNow(21) },
  ]
  const { error } = await supabase
    .from('tasks')
    .insert(tasks.map((t) => ({ client_id: clientId, title: t.title, done: t.done, due_date: t.dueDate, assignee: owner })))
  if (error) throw error
}

async function seedDocumentsFor(clientId: number) {
  const path = `${clientId}/${Date.now()}-seed-placeholder.pdf`
  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, PLACEHOLDER_PDF, {
    contentType: 'application/pdf',
  })
  if (uploadError) throw uploadError

  const { error } = await supabase.from('documents').insert([
    {
      client_id: clientId,
      title: 'Project Proposal',
      type: 'proposal',
      status: 'with_client',
      url: `storage:${path}`,
      updated_at: new Date().toISOString(),
    },
    {
      client_id: clientId,
      title: 'Brand Guidelines',
      type: 'guidelines',
      status: 'draft',
      url: null,
      updated_at: new Date().toISOString(),
    },
  ])
  if (error) throw error
}

async function seedUpdatesFor(clientId: number, owner: string) {
  const updates = [
    { text: 'Kicked things off — excited to get started!', date: daysFromNow(-20) },
    { text: 'First drafts are in review, more soon.', date: daysFromNow(-8) },
    { text: 'Thanks for the quick turnaround on feedback.', date: daysFromNow(-2) },
  ]
  const { error } = await supabase.from('updates').insert(
    updates.map((u) => ({
      client_id: clientId,
      text: u.text,
      date: u.date,
      author: owner,
      author_type: 'agency',
    }))
  )
  if (error) throw error
}

async function seedLeads() {
  console.log('Seeding leads...')
  const leads = [
    { companyName: `${SEED_TAG} Sample Skincare Co.`, status: 'new', owner: 'ro' },
    { companyName: `${SEED_TAG} Mock Meal Prep`, status: 'contacted', owner: 'niall' },
    { companyName: `${SEED_TAG} Demo Dog Grooming`, status: 'call_booked', owner: 'ro' },
    { companyName: `${SEED_TAG} Example Eyewear`, status: 'live_conversation', owner: 'niall' },
    { companyName: `${SEED_TAG} Pretend Pottery Studio`, status: 'not_now', owner: 'ro' },
    { companyName: `${SEED_TAG} Imaginary Interiors`, status: 'suppressed', owner: 'niall' },
    { companyName: `${SEED_TAG} Sandbox Smoothie Bar`, status: 'converted', owner: 'ro' },
  ]
  for (const lead of leads) {
    const { data, error } = await supabase
      .from('leads')
      .insert({ company_name: lead.companyName, status: lead.status, owner: lead.owner })
      .select('id')
      .single()
    if (error) throw error

    const steps = [
      { stepType: 'email_1', dueDate: daysFromNow(-10), done: true, orderIndex: 0 },
      { stepType: 'call_1', dueDate: daysFromNow(-5), done: lead.status !== 'new', orderIndex: 1 },
      { stepType: 'email_2', dueDate: daysFromNow(2), done: false, orderIndex: 2 },
    ]
    const { error: stepsError } = await supabase.from('sequence_steps').insert(
      steps.map((s) => ({
        lead_id: data.id,
        step_type: s.stepType,
        due_date: s.dueDate,
        done: s.done,
        order_index: s.orderIndex,
      }))
    )
    if (stepsError) throw stepsError
  }
}

// Creates (or reuses) an auth user for each team email and gives it an
// agency-role profile — so RO/Niall can magic-link sign in to the dev
// project immediately, without needing to sign in once first just to get
// an auth.users row created.
async function seedTeamProfiles() {
  console.log('Seeding team profiles...')
  for (const email of TEAM_EMAILS) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    let userId: string
    if (createError) {
      // Already exists from a prior run or a real sign-in — look it up instead.
      const { data: list, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) throw listError
      const existing = list.users.find((u) => u.email === email)
      if (!existing) throw createError
      userId = existing.id
    } else {
      userId = created.user.id
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'agency', full_name: email.split('@')[0] }, { onConflict: 'id' })
    if (profileError) throw profileError
  }
}

async function main() {
  console.log(`Seeding dev data into ${supabaseUrl}`)

  await wipeExistingSeed()
  const clientIds = await seedClients()
  for (const spec of CLIENT_SPECS) {
    const id = clientIds.get(spec.name)!
    await seedTasksFor(id, spec.owner)
    await seedDocumentsFor(id)
    await seedUpdatesFor(id, spec.owner)
  }
  await seedLeads()
  await seedTeamProfiles()

  console.log(`Done — seeded ${CLIENT_SPECS.length} clients, leads, and team profiles.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
