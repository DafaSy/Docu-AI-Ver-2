import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password — DocuAI</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0f;--card:rgba(255,255,255,.04);--border:rgba(255,255,255,.1);
    --text:#e4e4e7;--muted:#71717a;--muted2:#a1a1aa;
    --brand:#6366f1;--brand2:#818cf8;--danger:#ef4444;--success:#22c55e;
  }
  body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:var(--bg);color:var(--text);min-height:100vh;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;
  }
  .bg{position:fixed;inset:0;z-index:-1;overflow:hidden}
  .bg::before{content:'';position:absolute;top:-30%;left:50%;width:900px;height:600px;
    transform:translateX(-50%);border-radius:50%;background:rgba(99,102,241,.15);filter:blur(140px)}
  .bg::after{content:'';position:absolute;bottom:-10%;right:-5%;width:360px;height:360px;
    border-radius:50%;background:rgba(129,140,248,.08);filter:blur(100px)}
  .container{width:100%;max-width:420px}
  .logo{display:flex;align-items:center;gap:.6rem;margin-bottom:2rem}
  .logo-icon{width:40px;height:40px;border-radius:12px;
    background:linear-gradient(135deg,var(--brand),var(--brand2));
    display:flex;align-items:center;justify-content:center}
  .logo-icon svg{width:20px;height:20px;color:#fff}
  .logo-text{font-size:.875rem;font-weight:600;color:#fff;line-height:1.2}
  .logo-sub{font-size:.75rem;color:var(--muted)}
  .card{
    background:var(--card);border:1px solid var(--border);border-radius:16px;
    padding:2rem;backdrop-filter:blur(12px);
  }
  .header{display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem}
  .header-icon{width:44px;height:44px;border-radius:12px;
    background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.2);
    display:flex;align-items:center;justify-content:center}
  .header-icon svg{width:20px;height:20px;color:var(--brand2)}
  .header h1{font-size:1.25rem;font-weight:700;color:#fff}
  .header p{font-size:.875rem;color:var(--muted)}
  .field{margin-bottom:1.25rem}
  .field label{display:block;font-size:.875rem;font-weight:500;color:var(--muted2);margin-bottom:.5rem}
  .input-wrap{position:relative}
  .input-wrap svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted)}
  .input-wrap button{position:absolute;right:12px;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:var(--muted);padding:4px}
  input{
    width:100%;padding:.625rem 2.5rem .625rem 2.5rem;border-radius:12px;
    border:1px solid var(--border);background:rgba(255,255,255,.05);
    color:#fff;font-size:.875rem;outline:none;transition:border-color .2s;
  }
  input::placeholder{color:#52525b}
  input:focus{border-color:var(--brand)}
  input.match{border-color:var(--success)!important}
  input.mismatch{border-color:var(--danger)!important}
  .strength{display:flex;gap:4px;margin-top:6px}
  .strength-bar{height:4px;flex:1;border-radius:2px;background:rgba(255,255,255,.1);transition:background .3s}
  .strength-label{font-size:.75rem;font-weight:500;margin-top:4px}
  .alert{
    display:flex;align-items:flex-start;gap:.75rem;padding:.75rem 1rem;
    border-radius:12px;margin-bottom:1.25rem;font-size:.875rem;
  }
  .alert.error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fca5a5}
  .alert.success{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#86efac}
  .btn{
    width:100%;padding:.625rem;border-radius:12px;border:none;cursor:pointer;
    background:linear-gradient(to right,var(--brand),#4f46e5);color:#fff;
    font-size:.875rem;font-weight:600;transition:opacity .2s;
  }
  .btn:hover{opacity:.9}
  .btn:disabled{opacity:.5;cursor:not-allowed}
  .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);
    border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
  @keyframes spin{to{transform:rotate(360deg)}}
  .center{text-align:center}
  .link{display:flex;align-items:center;justify-content:center;gap:6px;
    margin-top:1.25rem;font-size:.875rem;color:var(--muted);text-decoration:none;transition:color .2s}
  .link:hover{color:var(--muted2)}
  .state{text-align:center;padding:1.5rem 0}
  .state-icon{width:64px;height:64px;border-radius:50%;margin:0 auto 1.25rem;
    display:flex;align-items:center;justify-content:center}
  .state-icon.loading{background:rgba(99,102,241,.15)}
  .state-icon.error{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.2)}
  .state-icon.success{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.2)}
  .state h2{font-size:1.25rem;font-weight:700;color:#fff;margin-bottom:.75rem}
  .state p{font-size:.875rem;color:var(--muted);line-height:1.5;max-width:300px;margin:0 auto}
  .footer{text-align:center;margin-top:2rem;font-size:.75rem;color:#52525b}
  .btn-link{
    display:block;width:100%;padding:.625rem;border-radius:12px;
    background:linear-gradient(to right,var(--brand),#4f46e5);color:#fff;
    font-size:.875rem;font-weight:600;text-decoration:none;text-align:center;
    margin-top:1.5rem;transition:opacity .2s;
  }
  .btn-link:hover{opacity:.9}
  .check-icon{position:absolute;right:40px;top:50%;transform:translateY(-50%);color:var(--success)}
  .x-icon{position:absolute;right:40px;top:50%;transform:translateY(-50%);color:var(--danger)}
</style>
</head>
<body>
<div class="bg"></div>
<div class="container">
  <div class="logo">
    <div class="logo-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
    </div>
    <div>
      <div class="logo-text">DocuAI</div>
      <div class="logo-sub">n8n webhook delivery</div>
    </div>
  </div>
  <div class="card" id="card">
    <div class="state" id="loading-state">
      <div class="state-icon loading">
        <div class="spinner" style="border-color:rgba(99,102,241,.3);border-top-color:var(--brand2)"></div>
      </div>
      <p>Verifying your reset link…</p>
    </div>
  </div>
  <div class="footer">Built for n8n webhook automation.</div>
</div>

<script>
const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_KEY = "${SUPABASE_ANON_KEY}";

function svgLock(){return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'}
function svgEye(){return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'}
function svgEyeOff(){return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'}
function svgCheck(){return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'}
function svgX(){return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'}
function svgAlert(){return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>'}
function svgSuccess(){return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'}
function svgShield(){return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.96 6.24-2.71a1 1 0 0 1 .52 0C13.5 3.04 16 5 18 5a1 1 0 0 1 1 1z"/></svg>'}
function svgArrow(){return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'}

function getStrength(pw){
  let s=0;
  if(pw.length>=8)s++;if(pw.length>=12)s++;if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;
  if(s<=1)return{score:s,label:"Weak",color:"#ef4444"};
  if(s<=2)return{score:s,label:"Fair",color:"#facc15"};
  if(s<=3)return{score:s,label:"Good",color:"#818cf8"};
  return{score:s,label:"Strong",color:"#22c55e"};
}

const card = document.getElementById('card');

function showError(msg){
  card.innerHTML = \`
    <div class="state">
      <div class="state-icon error">\${svgAlert()}</div>
      <h2>Link expired or invalid</h2>
      <p>\${msg}</p>
      <a class="btn-link" href="/reset-password">Request new link</a>
    </div>\`;
}

function showForm(){
  card.innerHTML = \`
    <div class="header">
      <div class="header-icon">\${svgShield()}</div>
      <div><h1>Set new password</h1><p>Choose something strong and unique</p></div>
    </div>
    <div id="alert-area"></div>
    <form id="reset-form">
      <div class="field">
        <label for="pw">New password</label>
        <div class="input-wrap">
          \${svgLock()}
          <input id="pw" type="password" placeholder="At least 6 characters" required autocomplete="new-password" autofocus />
          <button type="button" id="toggle-pw">\${svgEye()}</button>
        </div>
        <div class="strength" id="strength-bars" style="display:none">
          <div class="strength-bar"></div><div class="strength-bar"></div>
          <div class="strength-bar"></div><div class="strength-bar"></div>
        </div>
        <div class="strength-label" id="strength-label" style="display:none"></div>
      </div>
      <div class="field">
        <label for="cpw">Confirm new password</label>
        <div class="input-wrap">
          \${svgLock()}
          <input id="cpw" type="password" placeholder="Repeat your new password" required autocomplete="new-password" />
          <button type="button" id="toggle-cpw">\${svgEye()}</button>
          <span id="match-icon"></span>
        </div>
      </div>
      <button class="btn" type="submit" id="submit-btn">Update password</button>
    </form>
    <a class="link" href="/login">\${svgArrow()} Back to sign in</a>
  \`;

  const pwEl = document.getElementById('pw');
  const cpwEl = document.getElementById('cpw');
  const sBars = document.getElementById('strength-bars');
  const sLabel = document.getElementById('strength-label');
  const matchIcon = document.getElementById('match-icon');
  let showPw=false, showCpw=false;

  document.getElementById('toggle-pw').onclick = function(){
    showPw=!showPw; pwEl.type=showPw?'text':'password';
    this.innerHTML = showPw?svgEyeOff():svgEye();
  };
  document.getElementById('toggle-cpw').onclick = function(){
    showCpw=!showCpw; cpwEl.type=showCpw?'text':'password';
    this.innerHTML = showCpw?svgEyeOff():svgEye();
  };

  pwEl.oninput = function(){
    if(this.value.length>0){
      sBars.style.display='flex'; sLabel.style.display='block';
      const st=getStrength(this.value);
      sBars.querySelectorAll('.strength-bar').forEach((b,i)=>{
        b.style.background = st.score>i?st.color:'rgba(255,255,255,.1)';
      });
      sLabel.textContent = st.label + ' password';
      sLabel.style.color = st.color;
    } else {
      sBars.style.display='none'; sLabel.style.display='none';
    }
    if(cpwEl.value.length>0) updateMatch();
  };

  function updateMatch(){
    if(cpwEl.value.length===0){matchIcon.innerHTML='';cpwEl.classList.remove('match','mismatch');return;}
    if(pwEl.value===cpwEl.value){
      matchIcon.innerHTML='<span class="check-icon">'+svgCheck()+'</span>';
      cpwEl.classList.add('match'); cpwEl.classList.remove('mismatch');
    } else {
      matchIcon.innerHTML='<span class="x-icon">'+svgX()+'</span>';
      cpwEl.classList.add('mismatch'); cpwEl.classList.remove('match');
    }
  }
  cpwEl.oninput = updateMatch;

  document.getElementById('reset-form').onsubmit = async function(e){
    e.preventDefault();
    const alertArea = document.getElementById('alert-area');
    const pw = pwEl.value, cpw = cpwEl.value;

    if(pw.length<6){alertArea.innerHTML='<div class="alert error">Password must be at least 6 characters.</div>';return;}
    if(pw!==cpw){alertArea.innerHTML='<div class="alert error">Passwords do not match.</div>';return;}

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating password…';

    try {
      const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionStorage.getItem('access_token'),
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ password: pw }),
      });

      if(!res.ok){
        const d = await res.json().catch(()=>({}));
        throw new Error(d.msg || d.message || 'Failed to update password');
      }

      card.innerHTML = \`
        <div class="state">
          <div class="state-icon success">\${svgSuccess()}</div>
          <h2>Password updated!</h2>
          <p>Your password has been changed successfully. You can now sign in with your new password.</p>
          <a class="btn-link" href="/login">Back to sign in</a>
        </div>\`;
    } catch(err) {
      btn.disabled = false;
      btn.textContent = 'Update password';
      alertArea.innerHTML = '<div class="alert error">' + (err.message || 'Failed to update password. The link may have expired.') + '</div>';
    }
  };
}

// Parse hash token
const hash = window.location.hash.slice(1);
const params = new URLSearchParams(hash);
const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');
const type = params.get('type');

if(accessToken && refreshToken && type === 'recovery'){
  // Store token and verify session
  sessionStorage.setItem('access_token', accessToken);
  sessionStorage.setItem('refresh_token', refreshToken);

  // Verify the token is valid by making a test request
  fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'apikey': SUPABASE_KEY,
    },
  }).then(res => {
    if(res.ok){
      window.history.replaceState(null, '', window.location.pathname);
      showForm();
    } else {
      showError('This reset link has already been used or has expired. Reset links are valid for 1 hour. Please request a fresh one.');
    }
  }).catch(() => {
    showError('Could not verify the reset link. Please try again or request a new one.');
  });
} else {
  // No token in hash — check if we already have a session from earlier
  const existingToken = sessionStorage.getItem('access_token');
  if(existingToken){
    showForm();
  } else {
    showError('No reset token found. Please use the link from your email to reset your password.');
  }
}
</script>
</body>
</html>`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
    },
  });
});
