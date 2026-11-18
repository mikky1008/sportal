// Admin Settings: profile, password, sessions, notification preferences, system information.
// THROWAWAY local Postgres only; API at http://localhost:8799 started with ADMIN_EMAIL=admin@sportal.test ADMIN_PASSWORD=Adm1n-Secret-Pass.
// The suite changes the administrator's password and puts it back at the end.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { approvedRep } from "./_rep.mjs";
const BASE="http://localhost:8799";
const ORIG="Adm1n-Secret-Pass", NEWPW="Sett1ngs-Changed-Pw";
const UA={chrome:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",iphone:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",curl:"curl/8.4.0"};
const send=(m,p,t,b,ua)=>fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b!==undefined?{"content-type":"application/json"}:{}),...(ua?{"user-agent":ua}:{})},body:b!==undefined?JSON.stringify(b):undefined});
// the server closes the connection after refusing a huge body; the next request may land on that dead socket, so retry once
const call=async(m,p,t,b,ua)=>{let r;try{r=await send(m,p,t,b,ua)}catch{r=await send(m,p,t,b,ua)};const text=await r.text();let d=null;try{d=JSON.parse(text)}catch{};return {s:r.status,d,text}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)?.slice(0,300)))};
const login=(pw=ORIG,ua)=>call("POST","/api/admin/auth/login",null,{identifier:"admin@sportal.test",password:pw},ua);
const clear=()=>sql("DELETE FROM login_attempts");
sql("DELETE FROM signup_attempts"); clear();
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const adminId=sql("SELECT id FROM users WHERE email='admin@sportal.test'");
const pkgVersion=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8")).version;
const png="data:image/png;base64,"+Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.alloc(2000,1)]).toString("base64");

// ---------- people and sessions
const S=await call("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:"Stu",lastName:"Set"+ts,email:`stu${ts}@set.ph`});
const K=await call("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:"Coa",lastName:"Set"+ts,email:`coa${ts}@set.ph`,organization:"Org",position:"Head coach",sport:"Basketball"});
const R=await approvedRep(call,{...pw,accountType:"university_representative",firstName:"Rep",lastName:"Set"+ts,email:`rep${ts}@set.ph`,university:"Set University "+ts,designation:"Dean"});
const A=(await login(ORIG,UA.chrome)).d.token;       // this device (Chrome on Windows)
const B=(await login(ORIG,UA.iphone)).d.token;       // another device
const C=(await login(ORIG,UA.curl)).d.token;         // and another
t("three administrator sessions exist",!!A&&!!B&&!!C);
const me=(tok)=>call("GET","/api/auth/me",tok);
const get=(p,tok=A)=>call("GET","/api/admin/settings"+p,tok);

// ---------- access control
const endpoints=[["GET","/api/admin/header"],["GET","/api/admin/settings/profile"],["PUT","/api/admin/settings/profile",{displayName:"X Y"}],["PUT","/api/admin/settings/avatar",{dataUrl:png}],["DELETE","/api/admin/settings/avatar"],["POST","/api/admin/settings/password",{currentPassword:ORIG,newPassword:NEWPW}],["GET","/api/admin/settings/sessions"],["POST","/api/admin/settings/sessions/revoke-others",{}],["DELETE","/api/admin/settings/sessions/abc"],["GET","/api/admin/settings/notifications"],["PUT","/api/admin/settings/notifications",{reports:false}],["GET","/api/admin/settings/system"]];
for(const [who,tok] of [["anonymous",null],["a student",S.d.token],["a coach",K.d.token],["a representative",R.d.token]]){
  const want=tok?403:401; let ok=true,bad=[];
  for(const [m,p,b] of endpoints){const r=await call(m,p,tok,b); if(r.s!==want){ok=false;bad.push(m+" "+p+" "+r.s)}}
  t(`${who}: all ${endpoints.length} settings endpoints are ${want}`,ok,bad);
}
t("none of those attempts changed anything",sql(`SELECT display_name FROM users WHERE id='${adminId}'`)==="Sportal Administrator"&&(await get("/notifications")).d.preferences.reports===true);

// ---------- profile
let r=await get("/profile");
t("profile shows name, email, username, dates; no password hash",r.s===200&&r.d.profile.displayName==="Sportal Administrator"&&r.d.profile.email==="admin@sportal.test"&&r.d.profile.username==="sportaladmin"&&!!r.d.profile.createdAt&&!r.text.includes("scrypt$")&&!/password_hash/.test(r.text),r.d);
r=await call("PUT","/api/admin/settings/profile",A,{displayName:"  Maria   Santos  ",firstName:"Maria",lastName:"Santos",email:"hacker@evil.ph",username:"hacked"});
t("name and first/last name are saved (extra spaces tidied)",r.s===200&&r.d.profile.displayName==="Maria Santos"&&r.d.profile.firstName==="Maria"&&r.d.profile.lastName==="Santos",r.d);
t("email and username cannot be changed from here",r.d.profile.email==="admin@sportal.test"&&r.d.profile.username==="sportaladmin"&&sql(`SELECT email||'|'||username FROM users WHERE id='${adminId}'`)==="admin@sportal.test|sportaladmin");
t("the new name is what the rest of the app sees",(await me(A)).d.user.displayName==="Maria Santos");
t("signing in still works after the profile change",(await login()).d.ok===true);
r=await call("PUT","/api/admin/settings/profile",A,{displayName:""}); t("an empty name is refused (400)",r.s===400&&!!r.d.fieldErrors?.displayName,r.d);
t("a 1-character name is refused (400)",(await call("PUT","/api/admin/settings/profile",A,{displayName:"M"})).s===400);
t("a name over 80 characters is refused (400)",(await call("PUT","/api/admin/settings/profile",A,{displayName:"x".repeat(81)})).s===400);
t("a first name over 40 characters is refused (400)",(await call("PUT","/api/admin/settings/profile",A,{displayName:"Maria S",firstName:"x".repeat(41)})).s===400);
r=await call("PUT","/api/admin/settings/profile",A,{displayName:"Mar\u0000ia\u0007 Santos"}); t("control characters are stripped from names",r.d.profile.displayName==="Maria Santos",r.d);
t("the unchanged profile still reads the same",(await get("/profile")).d.profile.displayName==="Maria Santos");

// ---------- photo
r=await call("PUT","/api/admin/settings/avatar",A,{dataUrl:png}); t("a PNG photo is saved",r.s===200&&r.d.profile.avatar===png,r.s);
t("the top bar gets the photo and name",(await call("GET","/api/admin/header",A)).d.header.avatar===png&&(await call("GET","/api/admin/header",A)).d.header.displayName==="Maria Santos");
t("a non-image data URL is refused (400)",(await call("PUT","/api/admin/settings/avatar",A,{dataUrl:"data:text/html;base64,PHNjcmlwdD4="})).s===400);
t("a plain URL is refused (400)",(await call("PUT","/api/admin/settings/avatar",A,{dataUrl:"https://evil.example/x.png"})).s===400);
t("an SVG is refused (400)",(await call("PUT","/api/admin/settings/avatar",A,{dataUrl:"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="})).s===400);
t("a photo over the 300 KB limit is refused (400)",(await call("PUT","/api/admin/settings/avatar",A,{dataUrl:"data:image/png;base64,"+"A".repeat(300500)})).s===400);
const huge=await call("PUT","/api/admin/settings/avatar",A,{dataUrl:"data:image/png;base64,"+"A".repeat(1_500_000)}).then(x=>x.s>=400,()=>true);
t("a huge request body is rejected outright",huge===true);
t("a refused photo did not replace the saved one",(await get("/profile")).d.profile.avatar===png);
r=await call("DELETE","/api/admin/settings/avatar",A); t("the photo can be removed",r.s===200&&r.d.profile.avatar===null&&(await call("GET","/api/admin/header",A)).d.header.avatar===null);

// ---------- password: refusals
const change=(cur,next,extra={})=>call("POST","/api/admin/settings/password",A,{currentPassword:cur,newPassword:next,...extra});
r=await change("Wrong-current-pw1",NEWPW); t("a wrong current password is refused",r.s===400&&!!r.d.fieldErrors?.currentPassword,r.d);
t("...and nothing changed: the old password still works",(await login()).d.ok===true);
t("a missing current password is refused (400)",(await change("",NEWPW)).s===400);
t("a short new password is refused (400)",(await change(ORIG,"Short1a")).s===400);
t("a new password with no number is refused (400)",(await change(ORIG,"onlyletterspassword")).s===400);
t("a new password with no letter is refused (400)",(await change(ORIG,"123456789012")).s===400);
t("a new password equal to the current one is refused (400)",(await change(ORIG,ORIG)).s===400);
t("mismatched confirmation is refused (400)",(await change(ORIG,NEWPW,{confirmPassword:"Different-Pw-123"})).s===400);
t("a 129-character password is refused (400)",(await change(ORIG,"a1".repeat(65))).s===400);
t("no refused attempt changed the stored password",(await login()).d.ok===true);
// guessing the current password is rate limited
clear();
for(let i=0;i<5;i++) await change("Guess-"+i+"-wrong-pw",NEWPW);
r=await change(ORIG,NEWPW); t("after 5 wrong guesses even the right password is locked out (429)",r.s===429&&r.d.retryAfterSec>0,r);
t("...and the administrator's normal sign-in is NOT locked by that",(await login()).d.ok===true);
clear();

// ---------- password: success
const bytesBefore=sql(`SELECT password_hash FROM users WHERE id='${adminId}'`);
r=await change(ORIG,NEWPW,{confirmPassword:NEWPW});
t("the password is changed and other devices are signed out",r.s===200&&r.d.otherSessionsSignedOut>=2,r.d);
t("this device stays signed in",(await me(A)).s===200&&(await call("GET","/api/admin/settings/profile",A)).s===200);
t("the other devices (B, C) were signed out at once",(await me(B)).s===401&&(await me(C)).s===401);
t("the stored password hash changed and is not the new password",sql(`SELECT password_hash FROM users WHERE id='${adminId}'`)!==bytesBefore&&!sql(`SELECT password_hash FROM users WHERE id='${adminId}'`).includes(NEWPW));
t("the old password no longer signs in",(await login(ORIG)).d.ok===false);
t("the new password does",(await login(NEWPW)).d.ok===true);
t("the change time is recorded",!!(await get("/profile")).d.profile.passwordChangedAt&&Date.now()-Date.parse((await get("/profile")).d.profile.passwordChangedAt)<60000);
t("the change is in the audit log without any password",+sql("SELECT count(*) FROM audit_log WHERE event='admin.password_changed'")>=1&&+sql(`SELECT count(*) FROM audit_log WHERE detail LIKE '%${NEWPW}%' OR detail LIKE '%${ORIG}%'`)===0);

// ---------- sessions
const D=(await login(NEWPW,UA.iphone)).d.token, E=(await login(NEWPW,UA.curl)).d.token;
r=await get("/sessions");
const list=r.d.sessions;
t("the session list has this device flagged exactly once",r.s===200&&list.filter(s=>s.current).length===1,list.map(s=>s.current));
const mine=list.find(s=>s.current);
t("each session says what device it is (browser and OS), where from, and when",mine.device==="Chrome on Windows"&&mine.browser==="Chrome"&&mine.os==="Windows"&&!isNaN(Date.parse(mine.signedInAt))&&!isNaN(Date.parse(mine.lastActiveAt))&&Date.parse(mine.expiresAt)>Date.now(),mine);
t("an iPhone session reads as Safari on iOS",list.some(s=>s.device==="Safari on iOS"));
t("the list is exactly the administrator's live sessions",list.length===+sql(`SELECT count(*) FROM sessions WHERE user_id='${adminId}' AND revoked_at IS NULL AND expires_at>now()`),[list.length]);
const hashes=sql(`SELECT token_hash FROM sessions WHERE user_id='${adminId}'`).split("\n");
t("no stored token hash, token or hash prefix ever reaches the browser",hashes.every(h=>!r.text.includes(h)&&!r.text.includes(h.slice(0,16)))&&!r.text.includes(A)&&!r.text.includes("token_hash"));
const iphone=list.find(s=>s.device==="Safari on iOS"&&!s.current);
t("a student cannot revoke it (403)",(await call("DELETE",`/api/admin/settings/sessions/${iphone.id}`,S.d.token)).s===403);
t("this device cannot be revoked from the list (400)",(await call("DELETE",`/api/admin/settings/sessions/${mine.id}`,A)).s===400&&(await me(A)).s===200);
t("an unknown session id is a 404",(await call("DELETE","/api/admin/settings/sessions/doesnotexist",A)).s===404);
const iphoneTok=[D,E].find(()=>true); // D is an iPhone session
r=await call("DELETE",`/api/admin/settings/sessions/${list.find(s=>s.device==="Safari on iOS"&&!s.current).id}`,A);
t("a single other device can be signed out",r.s===200);
t("...it stops working at once, this device keeps working",(await me(D)).s===401&&(await me(A)).s===200&&(await me(E)).s===200);
t("signing out the same one again is a 404",(await call("DELETE",`/api/admin/settings/sessions/${iphone.id}`,A)).s===404);
r=await call("POST","/api/admin/settings/sessions/revoke-others",A,{});
t("all other devices can be signed out in one go",r.s===200&&r.d.revoked>=1,r.d);
t("...the others are dead, this device lives",(await me(E)).s===401&&(await me(A)).s===200);
t("...and only this device is left",(await get("/sessions")).d.sessions.length===1&&(await get("/sessions")).d.sessions[0].current===true);
t("signing out others when there are none is fine (0)",(await call("POST","/api/admin/settings/sessions/revoke-others",A,{})).d.revoked===0);
t("those actions are in the audit log",+sql("SELECT count(*) FROM audit_log WHERE event='admin.session_revoked'")>=1&&+sql("SELECT count(*) FROM audit_log WHERE event='admin.sessions_revoked'")>=1);
t("the student's own session was never touched",(await me(S.d.token)).s===200);

// ---------- notification preferences + the bell
r=await get("/notifications"); t("everything is on by default",r.s===200&&Object.values(r.d.preferences).every(v=>v===true)&&["applications","reports","registrations","security"].every(k=>k in r.d.preferences),r.d);
const header=async()=>(await call("GET","/api/admin/header",A)).d.header.bell;
const num=(q)=>+sql(q);
const expected={applications:num("SELECT count(*) FROM rep_applications ra JOIN users u ON u.id=ra.user_id AND u.deleted_at IS NULL WHERE ra.status='pending'"),reports:num("SELECT count(*) FROM content_reports WHERE status='pending'"),registrations:num("SELECT count(*) FROM users u WHERE u.deleted_at IS NULL AND u.created_at>now()-interval '7 days' AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name='admin')")};
let bell=await header();
t("with everything on, the bell counts are the real numbers",bell.applications===expected.applications&&bell.reports===expected.reports&&bell.registrations===expected.registrations&&Number.isInteger(bell.securityAlerts),[bell,expected]);
// make the security alerts non-zero and check
await login("Wrong-admin-pw-1"); clear();
t("a failed administrator sign-in is counted as a security alert",(await header()).securityAlerts===num("SELECT count(*) FROM audit_log WHERE event IN ('admin.login.failed','admin.login.blocked') AND created_at>now()-interval '24 hours'")&&(await header()).securityAlerts>=1);
for(const [pref,key] of [["applications","applications"],["reports","reports"],["registrations","registrations"],["security","securityAlerts"]]){
  r=await call("PUT","/api/admin/settings/notifications",A,{[pref]:false});
  t(`switching '${pref}' off is saved`,r.s===200&&r.d.preferences[pref]===false&&(await get("/notifications")).d.preferences[pref]===false,r.d);
  bell=await header();
  t(`...and the bell stops reporting it (${key} is null), while the others still report`,bell[key]===null&&Object.entries(bell).filter(([k])=>k!==key).every(([,v])=>v!==null),bell);
  await call("PUT","/api/admin/settings/notifications",A,{[pref]:true});
}
r=await call("PUT","/api/admin/settings/notifications",A,{applications:false,reports:false,registrations:false,security:false});
bell=await header(); t("with everything off the bell reports nothing",r.s===200&&Object.values(bell).every(v=>v===null),bell);
t("the dashboard's own numbers are not affected by notification preferences",(await call("GET","/api/admin/overview",A)).d.overview.totals.pending===expected.applications);
t("a non-boolean is refused (400) and changes nothing",(await call("PUT","/api/admin/settings/notifications",A,{reports:"yes"})).s===400&&(await get("/notifications")).d.preferences.reports===false);
await call("PUT","/api/admin/settings/notifications",A,{applications:true,reports:true,registrations:true,security:true,bogus:true});
r=await get("/notifications"); t("preferences are restored; unknown keys are ignored",Object.values(r.d.preferences).every(v=>v===true)&&Object.keys(r.d.preferences).length===4,r.d);
t("the preferences live in the database",sql(`SELECT notify_applications::text||notify_reports::text FROM admin_preferences WHERE user_id='${adminId}'`)==="truetrue");

// ---------- system information
r=await get("/system"); const sys=r.d.system;
t("system info loads",r.s===200&&!!sys,r.d);
t("version is the real package version",sys.application.version===pkgVersion,[sys.application.version,pkgVersion]);
t("environment, runtime, server time and uptime are real",!!sys.application.environment&&/^Node\.js \d+/.test(sys.application.runtime)&&Math.abs(Date.now()-Date.parse(sys.application.serverTime))<5000&&sys.application.uptimeSeconds>=0&&Date.parse(sys.application.startedAt)<=Date.now());
t("database engine, reachability and latency are measured",/^PostgreSQL \d+/.test(sys.database.engine)&&sys.database.reachable===true&&sys.database.latencyMs>0&&sys.database.sizeBytes>0);
t("schema version matches the migrations table",sys.database.schemaVersion===num("SELECT max(version) FROM schema_migrations")&&sys.database.migrationsApplied===num("SELECT count(*) FROM schema_migrations"),sys.database);
t("platform totals equal the database",sys.platform.users===num("SELECT count(*) FROM users u WHERE u.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.name='admin')")&&sys.platform.schools===num("SELECT count(*) FROM universities")&&sys.platform.activeSessions===num("SELECT count(*) FROM sessions WHERE revoked_at IS NULL AND expires_at>now()")&&sys.platform.openReports===num("SELECT count(*) FROM content_reports WHERE status IN ('pending','investigating')")&&sys.platform.activityEvents>=num("SELECT count(*) FROM audit_log")-5,sys.platform);
t("security policy values are the real ones",sys.security.adminSessionHours===4&&sys.security.userSessionHours===12&&sys.security.rememberDays===30&&sys.security.adminPasswordMinLength===12&&sys.security.userPasswordMinLength===10&&sys.security.lockoutAttempts===5&&sys.security.lockoutMinutes===15,sys.security);
const dump=JSON.stringify(r.d);
t("no connection string, secret, hash or password in system info",!/postgres(ql)?:\/\//i.test(dump)&&!dump.includes(ORIG)&&!dump.includes(NEWPW)&&!dump.includes("scrypt$")&&!/DATABASE_URL/.test(dump)&&!dump.includes("127.0.0.1"));

// ---------- the activity log records these (security / administration)
const sec=(await call("GET","/api/admin/monitoring/activity?limit=50&category=security",A)).d.items.map(i=>i.description);
t("the log says the password was changed, by name",sec.includes("Changed their password")&&(await call("GET","/api/admin/monitoring/activity?limit=50&category=security",A)).d.items.some(i=>i.user.name==="Maria Santos"&&i.description==="Changed their password"),sec.slice(0,6));
t("the log records signing other devices out",sec.some(d=>/^Signed out (another device|all their other devices)/.test(d)));
t("the log records the failed current-password attempts",sec.some(d=>/wrong current password/.test(d)));
t("the log records the profile update",(await call("GET","/api/admin/monitoring/activity?limit=50&category=administration",A)).d.items.some(i=>/^Updated their profile \(.*name.*\)$/.test(i.description)));

// ---------- put everything back so the other suites can sign in as before
r=await call("POST","/api/admin/settings/password",A,{currentPassword:NEWPW,newPassword:ORIG}); t("the password can be put back",r.s===200,r.d);
t("the original password works again",(await login(ORIG)).d.ok===true);
await call("PUT","/api/admin/settings/profile",A,{displayName:"Sportal Administrator",firstName:"",lastName:""});
t("the profile is restored",sql(`SELECT display_name FROM users WHERE id='${adminId}'`)==="Sportal Administrator"&&sql(`SELECT coalesce(first_name,'') FROM user_profiles WHERE user_id='${adminId}'`)==="");
clear();
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
