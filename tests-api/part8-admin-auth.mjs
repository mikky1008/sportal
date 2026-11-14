// Administrator authentication. Run against a THROWAWAY local Postgres only. API at http://localhost:8799 started with
// ADMIN_EMAIL=admin@sportal.test ADMIN_PASSWORD=Adm1n-Secret-Pass ADMIN_USERNAME=sportaladmin
import { execSync } from "node:child_process";
const BASE="http://localhost:8799";
const ADMIN={email:"admin@sportal.test",username:"sportaladmin",password:"Adm1n-Secret-Pass"};
const j=async(m,p,t,b)=>{const r=await fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
sql("DELETE FROM signup_attempts"); sql("DELETE FROM login_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const reg=(type,extra={})=>j("POST","/api/auth/register",null,{...pw,accountType:type,firstName:"T",lastName:"U"+ts,email:`${type}${ts}@t.ph`,...extra});

// --- the account exists, from the environment, with the admin role only
t("admin account was provisioned with the admin role",sql(`SELECT string_agg(r.name,',') FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.email='${ADMIN.email}'`)==="admin");
t("the plain-text password is not stored",!sql(`SELECT password_hash FROM users WHERE email='${ADMIN.email}'`).includes(ADMIN.password) && sql(`SELECT password_hash FROM users WHERE email='${ADMIN.email}'`).startsWith("scrypt$"));

// --- no registration route can produce an administrator
let r=await j("POST","/api/auth/register",null,{...pw,accountType:"admin",firstName:"E",lastName:"Vil",email:`evil${ts}@t.ph`});
t("registering with accountType admin is rejected",r.d.ok===false && sql(`SELECT count(*) FROM users WHERE email='evil${ts}@t.ph'`)==="0",r.d);
r=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",roles:["admin"],role:"admin",firstName:"E",lastName:"Vil",email:`evil2${ts}@t.ph`});
t("extra roles/role fields on sign up never grant admin",r.d.ok===true && !r.d.user.roles.includes("admin"),r.d.user);
r=await reg("student_athlete",{email:ADMIN.email});
t("cannot register using the administrator's email",r.d.ok===false,r.d);

// --- ordinary users are unaffected
const S=await reg("student_athlete"); const C=await reg("coach",{organization:"Org",position:"Head coach",sport:"Basketball"});
t("student sign up still works",S.d.ok===true && S.d.user.roles.includes("student_athlete"));
t("coach sign up still works",C.d.ok===true && C.d.user.roles.includes("coach"));
r=await j("POST","/api/auth/login",null,{identifier:`coach${ts}@t.ph`,password:pw.password,remember:true});
t("coach still signs in on the regular login",r.d.ok===true && r.d.user.roles.includes("coach"));

// --- the regular login refuses the administrator (same message as a wrong password)
const wrong=await j("POST","/api/auth/login",null,{identifier:`coach${ts}@t.ph`,password:"Wrong-password-1",remember:false});
r=await j("POST","/api/auth/login",null,{identifier:ADMIN.email,password:ADMIN.password,remember:false});
t("regular login refuses the correct admin credentials",r.d.ok===false && r.d.code==="invalid_credentials" && !r.d.token,r.d);
t("...with exactly the wrong-password message (no hint)",r.d.message===wrong.d.message);
r=await j("POST","/api/auth/login",null,{identifier:ADMIN.username,password:ADMIN.password,remember:false,scope:"admin"});
t("a client cannot pass scope:admin to the regular login",r.d.ok===false,r.d);

// --- the dedicated admin login
r=await j("POST","/api/admin/auth/login",null,{identifier:ADMIN.email,password:"Wrong-password-1"});
t("admin login: wrong password refused",r.d.ok===false && r.d.code==="invalid_credentials");
for(const [who,id,p] of [["a student",`student_athlete${ts}@t.ph`,pw.password],["a coach",`coach${ts}@t.ph`,pw.password]]){
  r=await j("POST","/api/admin/auth/login",null,{identifier:id,password:p});
  t(`admin login refuses ${who} with a CORRECT password`,r.d.ok===false && r.d.code==="invalid_credentials" && !r.d.token,r.d);
  t(`...and the message equals a wrong-password message (${who})`,r.d.message===(await j("POST","/api/admin/auth/login",null,{identifier:ADMIN.email,password:"Nope-nope-nope1"})).d.message);
}
r=await j("POST","/api/admin/auth/login",null,{identifier:"ghost@nowhere.ph",password:"Whatever-123"});
t("admin login: unknown account refused",r.d.ok===false && r.d.code==="invalid_credentials");
r=await j("POST","/api/admin/auth/login",null,{identifier:ADMIN.email,password:ADMIN.password});
t("admin login succeeds with the configured credentials",r.d.ok===true && r.d.user.roles.includes("admin"),r.d);
const adm=r.d.token;
const ttl=(new Date(r.d.expiresAt).getTime()-Date.now())/3600000;
t("admin session is short (<= 4h) and not 'remembered'",ttl>3.9 && ttl<=4.01,ttl);
r=await j("POST","/api/admin/auth/login",null,{identifier:ADMIN.username.toUpperCase(),password:ADMIN.password});
t("admin can also sign in by username (case-insensitive)",r.d.ok===true);

// --- access control
r=await j("GET","/api/auth/me",adm); t("/auth/me works with the admin token",r.s===200 && r.d.user.roles.includes("admin"));
r=await j("GET","/api/admin/overview",adm); t("admin sees the dashboard overview",r.s===200 && r.d.ok && typeof r.d.overview.pendingVerifications==="number" && r.d.overview.users.students>=1,r.d);
const ov=r.d.overview;
t("overview has the four headline totals",["users","athletes","schools","pending"].every(k=>Number.isInteger(ov.totals[k])),ov.totals);
t("overview totals never count the administrator",ov.totals.users===+sql("SELECT count(*) FROM users u WHERE u.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name='admin')"),ov.totals);
t("registration analytics covers 6 months, oldest first",ov.registrations.length===6 && ov.registrations.every(m=>["athletes","coaches","schoolReps"].every(k=>Number.isInteger(m[k]))));
t("pending total matches the pending verification count",ov.totals.pending===+sql("SELECT count(*) FROM coach_verifications WHERE status='pending'"));
r=await j("GET","/api/admin/coach-verifications?status=pending",adm); t("admin can open coach verifications",r.s===200);
for(const [who,tok] of [["a student",S.d.token],["a coach",C.d.token]]){
  t(`${who} cannot read the admin overview (403)`,(await j("GET","/api/admin/overview",tok)).s===403);
  t(`${who} cannot open coach verifications (403)`,(await j("GET","/api/admin/coach-verifications",tok)).s===403);
}
t("anonymous cannot read the admin overview (401)",(await j("GET","/api/admin/overview")).s===401);
r=await j("POST","/api/auth/logout",adm); t("admin can sign out",r.d.ok===true);
t("token is dead after sign out",(await j("GET","/api/admin/overview",adm)).s===401);

// --- rate limiting is separate
sql("DELETE FROM login_attempts");
for(let i=0;i<6;i++) await j("POST","/api/admin/auth/login",null,{identifier:ADMIN.email,password:"Wrong-pass-"+i+"x"});
r=await j("POST","/api/admin/auth/login",null,{identifier:ADMIN.email,password:ADMIN.password});
t("admin login locks after repeated failures (even with the right password)",r.d.ok===false && r.d.code==="rate_limited",r.d);
r=await j("POST","/api/auth/login",null,{identifier:`coach${ts}@t.ph`,password:pw.password,remember:false});
t("...but the lockout does not affect a regular user's sign in",r.d.ok===true,r.d);
sql("DELETE FROM login_attempts");

// --- audit trail
t("admin sign-ins and failures are in the audit log",+sql("SELECT count(*) FROM audit_log WHERE event='admin.login.success'")>=1 && +sql("SELECT count(*) FROM audit_log WHERE event='admin.login.failed'")>=1);
t("no audit row contains a password",+sql(`SELECT count(*) FROM audit_log WHERE detail LIKE '%${ADMIN.password}%' OR identifier LIKE '%${ADMIN.password}%'`)===0);

// --- DB-level: only one administrator
t("exactly one account holds the admin role",sql("SELECT count(*) FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.name='admin'")==="1");
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
