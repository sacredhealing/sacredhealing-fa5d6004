import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    if (url.pathname.endsWith('/lookup')) {
      const email = url.searchParams.get('email');
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const match = data.users.filter(u => !email || u.email === email);
      return new Response(JSON.stringify({ count: match.length, users: match.map(u => ({ id: u.id, email: u.email })) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname.endsWith('/delete')) {
      const { user_id } = await req.json();
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, deleted: user_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { user_id, new_email } = await req.json();
    if (!user_id || !new_email) {
      return new Response(JSON.stringify({ error: 'user_id and new_email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data, error } = await admin.auth.admin.updateUserById(user_id, {
      email: new_email,
      email_confirm: true,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message, code: (error as any).code, status: (error as any).status }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ ok: true, user: { id: data.user?.id, email: data.user?.email } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, stack: (e as Error).stack }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
