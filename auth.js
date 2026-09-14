const SUPABASE_URL='https://uxsejwqzxmftyqfncmgf.supabase.co';
const SUPABASE_KEY='sb_publishable_7jNw8dRPfmzGo8xJ6SXo-w_rivj0GKd';
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let recovering=new URLSearchParams(location.search).get('mode')==='recovery'||new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
let mode=new URLSearchParams(location.search).get('mode')==='signup'?'signup':'signin';
const $=id=>document.getElementById(id),form=$('authForm'),alertBox=$('alert');
function alertMsg(msg,type='error'){alertBox.textContent=msg;alertBox.className=`alert show ${type}`}
async function routeMerchant(user){if(recovering)return;const {data,error}=await client.from('profiles').select('onboarding_complete').eq('id',user.id).maybeSingle();if(error)throw error;location.href=data?.onboarding_complete?'dashboard.html?view=overview':'onboarding.html'}
function setMode(m){mode=m;const up=m==='signup';$('signinTab').classList.toggle('active',!up);$('signupTab').classList.toggle('active',up);$('businessField').style.display=up?'block':'none';$('forgot').style.display=up?'none':'inline';$('authTitle').textContent=up?'Create your BCK account.':'Welcome bck.';$('authCopy').textContent=up?'Start with a merchant account. We’ll set up your store next.':'Sign in to your BCK merchant account.';$('submitBtn').textContent=up?'Create account ↗':'Sign in ↗';$('googleBtnText').textContent=up?'Sign up with Google':'Continue with Google';$('password').autocomplete=up?'new-password':'current-password';alertBox.className='alert'}
$('signinTab').onclick=()=>setMode('signin');$('signupTab').onclick=()=>setMode('signup');setMode(mode);
$('togglePassword').onclick=()=>{const p=$('password');p.type=p.type==='password'?'text':'password';$('togglePassword').textContent=p.type==='password'?'SHOW':'HIDE'};
form.onsubmit=async e=>{e.preventDefault();$('submitBtn').disabled=true;const email=$('email').value.trim(),password=$('password').value,business=$('business').value.trim();try{if(mode==='signup'){if(!business)throw new Error('Enter your business name.');const {data,error}=await client.auth.signUp({email,password,options:{data:{business_name:business},emailRedirectTo:new URL('auth.html',location.href).href}});if(error)throw error;if(data.session){await routeMerchant(data.user)}else alertMsg('Account created. Check your email to confirm your address, then sign in.','success')}else{const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;await routeMerchant(data.user)}}catch(err){alertMsg(err.message||'Something went wrong.')}finally{$('submitBtn').disabled=false}};
$('googleBtn').onclick=async()=>{const btn=$('googleBtn');btn.disabled=true;try{const redirectTo=new URL('auth.html?oauth=google',location.href).href;const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}});if(error)throw error}catch(err){alertMsg(err.message||'Google sign-in could not start.');btn.disabled=false}};
$('forgot').onclick=async()=>{const email=$('email').value.trim();if(!email||!$('email').reportValidity())return alertMsg('Enter a valid email first.');const btn=$('forgot');if(btn.disabled)return;btn.disabled=true;try{const redirect=new URL('auth.html?mode=recovery',location.href).href;const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});if(error)throw error;alertMsg('If this email has an account, you’ll receive a password reset link.','success')}catch{alertMsg('Could not send the recovery email. Please try again.')}finally{btn.disabled=false}};
function showRecovery(){
  recovering=true;
  $('authTitle').textContent='Choose a new password.';
  $('authCopy').textContent='Save your new password to recover your account.';
  document.querySelector('.auth-tabs').style.display='none';
  document.querySelector('.oauth-separator').style.display='none';
  $('googleBtn').style.display='none';$('businessField').style.display='none';
  $('email').closest('.field').style.display='none';$('email').required=false;
  $('forgot').style.display='none';$('password').autocomplete='new-password';
  $('submitBtn').textContent='Save new password ↗';
  form.onsubmit=async e=>{
    e.preventDefault();const btn=$('submitBtn');if(btn.disabled)return;btn.disabled=true;
    try{
      const {data}=await client.auth.getSession();
      if(!data.session)throw new Error('This recovery link has expired. Request a new reset email.');
      const {error}=await client.auth.updateUser({password:$('password').value});if(error)throw error;
      recovering=false;$('password').value='';history.replaceState({},'',location.pathname);
      await routeMerchant(data.session.user);
    }catch(err){alertMsg(err.message||'Could not update your password. Try again.')}finally{btn.disabled=false}
  };
}
alertBox.setAttribute('role','status');alertBox.setAttribute('aria-live','polite');
client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')showRecovery()});
if(recovering)showRecovery();
(async()=>{try{const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session)await routeMerchant(data.session.user)}catch{alertMsg('Could not restore your session. Please sign in again.')}})();
