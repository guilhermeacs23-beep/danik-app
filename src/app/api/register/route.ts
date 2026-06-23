import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios.' }, { status: 400 })
  }

  // Admin client — bypasses RLS
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  const userId = authData.user.id

  // 2. Create tenant
  const slug = 'danik-' + Date.now().toString(36)
  const { data: tenant, error: tenantErr } = await admin
    .schema('danik')
    .from('tenants')
    .insert({ name: 'DANIK', slug })
    .select()
    .single()
  if (tenantErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: tenantErr.message }, { status: 400 })
  }

  // 3. Create profile
  const { error: profileErr } = await admin
    .schema('danik')
    .from('profiles')
    .insert({ id: userId, tenant_id: tenant.id, name, role: 'owner' })
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
