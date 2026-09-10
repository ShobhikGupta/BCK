const SUPABASE_URL='https://uxsejwqzxmftyqfncmgf.supabase.co';
const SUPABASE_KEY='sb_publishable_7jNw8dRPfmzGo8xJ6SXo-w_rivj0GKd';
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
(async()=>{const {data:{session}}=await client.auth.getSession();if(!session){location.href='auth.html';return}document.getElementById('userEmail').textContent=session.user.email||'Signed in';const {data}=await client.from('profiles').select('business_name').eq('id',session.user.id).maybeSingle();if(data?.business_name)document.getElementById('businessName').textContent=data.business_name})();
async function out(){await client.auth.signOut();location.href='auth.html'}document.getElementById('signout').onclick=out;document.getElementById('signoutTop').onclick=out;
