import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // auth.users에서 로그인 정보 가져오기
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) throw error

    // 로그인 기록이 있는 사용자만 필터링하고 최근 로그인 순으로 정렬
    const users = data.users
      .filter(user => user.last_sign_in_at)
      .sort((a, b) => 
        new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime()
      )

    // 사용자 ID 목록
    const userIds = users.map(user => user.id)

    // 관리자 이름 정보 가져오기
    const adminIds = users
      .filter(user => user.user_metadata?.role === 'administrator')
      .map(user => user.id)

    let adminNames = new Map()
    if (adminIds.length > 0) {
      const { data: adminData } = await supabaseAdmin
        .from('administrators')
        .select('user_id, full_name')
        .in('user_id', adminIds)
      
      adminData?.forEach(admin => {
        adminNames.set(admin.user_id, admin.full_name)
      })
    }

    // 사용자별 실제 역할(직급) 정보 가져오기
    let userRoles = new Map()
    if (userIds.length > 0) {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select(`
          user_id,
          roles!inner(role_name)
        `)
        .in('user_id', userIds)
      
      roleData?.forEach(ur => {
        userRoles.set(ur.user_id, ur.roles.role_name)
      })
    }

    // 사용자 정보 포맷팅
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: userRoles.get(user.id) || user.user_metadata?.role || 'user',
      full_name: adminNames.get(user.id) || user.user_metadata?.full_name || '-'
    }))

    return new Response(
      JSON.stringify({ users: formattedUsers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})