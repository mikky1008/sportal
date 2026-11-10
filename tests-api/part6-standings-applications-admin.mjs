// Run against a THROWAWAY local Postgres only (it creates users and edits roles by SQL). Needs psql access as the postgres user; edit the sql() helper for your setup. API at http://localhost:8799.
import { execSync } from "node:child_process";
const BASE="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
await j("POST","/api/auth/login",null,{identifier:"warmup",password:"x"});
sql("DELETE FROM signup_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const LAST="Std"+ts;
const athlete=async(first,sport="Basketball")=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`});
  await j("PUT","/api/athletes/me/profile",r.d.token,{firstName:first,lastName:LAST,sport,position:"",school:"School "+first,municipality:"Tubod",year:"",heightCm:"",weightKg:"",teamStatus:"",teamName:"",bio:"",achievements:[]});
  return {id:r.d.user.id,tok:r.d.token};
};
const coach=async(first,verified)=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`,organization:first+" Academy",position:"Head coach",sport:"Basketball"});
  if(verified) sql(`INSERT INTO user_roles (user_id, role_id, granted_at) SELECT '${r.d.user.id}', id, now() FROM roles WHERE name='verified_coach'`);
  const l=await j("POST","/api/auth/login",null,{identifier:`${first.toLowerCase()}${ts}@t.ph`,password:pw.password,remember:false});
  return {id:r.d.user.id,tok:l.d.token,email:`${first.toLowerCase()}${ts}@t.ph`};
};
const connect=async(c,a)=>{const r=await j("POST","/api/connections/requests",c.tok,{userId:a.id});const acc=await j("POST",`/api/connections/requests/${r.d.connection.id}/accept`,a.tok);return acc.s===200;};
const notes=async(a,cat)=>(await j("GET",`/api/notifications?category=${cat}`,a.tok)).d.items;

// =============== 1. rank / performance / consistency are worked out, not stored ===============
const Cora=await coach("Cora",true);
const A=await athlete("Aaa"), B=await athlete("Bbb"), N=await athlete("Nnn");
for(const r of [80,90,85]) await j("POST","/api/athletes/me/sessions",A.tok,{skill:"shooting",result:r,consistency:90,source:"ai"});
for(let i=0;i<3;i++) await j("POST","/api/athletes/me/sessions",B.tok,{skill:"shooting",result:70,consistency:60,source:"ai"});
await j("POST","/api/athletes/me/sessions",A.tok,{skill:"vertical",result:74,consistency:50,source:"ai"});
let r=await j("GET","/api/athletes/me/profile",A.tok); const pa=r.d.profile;
t("athlete's own profile: performance = average of counted % results (85), vertical left out",pa.performanceScore===85,pa);
t("athlete's own profile: consistency = average of counted consistencies (90,90,90,50 → 80)",pa.consistency===80,pa);
t("athlete's own profile: rank is a real position",typeof pa.rank==="number"&&pa.rank>=1,pa.rank);
r=await j("GET","/api/athletes/me/profile",B.tok); t("a lower performer ranks below (B behind A)",r.d.profile.rank>pa.rank&&r.d.profile.performanceScore===70,r.d.profile);
r=await j("GET","/api/athletes/me/profile",N.tok); const pn=r.d.profile;
t("an athlete with no sessions: rank, performance, consistency are all empty (not made up)",pn.rank===null&&pn.performanceScore===null&&pn.consistency===null,pn);
sql(`UPDATE athlete_profiles SET ranking=1, performance=99, consistency=99 WHERE user_id='${N.id}'`);
r=await j("GET","/api/athletes/me/profile",N.tok); t("old stored columns are ignored (still empty after setting them by SQL)",r.d.profile.rank===null&&r.d.profile.performanceScore===null,r.d.profile);
await j("POST","/api/athletes/me/sessions",N.tok,{skill:"shooting",result:60,consistency:50,source:"manual"});
r=await j("GET","/api/athletes/me/profile",N.tok); t("a self-reported session does not count",r.d.profile.performanceScore===null,r.d.profile);
for(const a of [A,B]) t("connect "+a.id.slice(0,4),await connect(Cora,a));
r=await j("GET","/api/coach/athletes",Cora.tok); const roster=Object.fromEntries(r.d.items.map(x=>[x.firstName,x]));
t("coach roster shows the same live numbers (A: 85 / 80, ranked)",roster.Aaa&&roster.Aaa.performance===85&&roster.Aaa.consistency===80&&roster.Aaa.rank>=1,roster.Aaa);
t("coach roster: B ranked below A",roster.Bbb.rank>roster.Aaa.rank&&roster.Bbb.performance===70,[roster.Aaa?.rank,roster.Bbb?.rank]);
await j("PUT","/api/athletes/me/visibility",B.tok,{visible:false});
r=await j("GET","/api/coach/athletes",Cora.tok); t("a connected athlete who hides from rankings shows no rank (numbers still shown)",r.d.items.find(x=>x.firstName==="Bbb").rank===null&&r.d.items.find(x=>x.firstName==="Bbb").performance===70,r.d.items.find(x=>x.firstName==="Bbb"));
await j("POST","/api/athletes/me/sessions",A.tok,{skill:"shooting",result:100,consistency:100,source:"ai"});
r=await j("GET","/api/athletes/me/profile",A.tok); t("numbers update as soon as a new session is logged (85→ (80+90+85+100)/4=88.8)",r.d.profile.performanceScore===88.8,r.d.profile.performanceScore);

// =============== 2. ATHLETE APPLICATIONS TO A COACH ===============
const Cleo=await coach("Cleo",true), Uma=await coach("Uma",false);
const P=await athlete("Pat"), Q=await athlete("Quin");
r=await j("GET",`/api/search?q=${encodeURIComponent("Cleo "+LAST)}`,P.tok); const found=r.d.coaches.find(c=>c.id===Cleo.id);
t("an athlete can find a verified coach by name (with organization and sport)",found&&found.organization==="Cleo Academy"&&found.sport==="Basketball"&&found.relationship==="none",r.d.coaches);
t("an unverified coach is not offered to athletes",!(await j("GET",`/api/search?q=${encodeURIComponent("Uma "+LAST)}`,P.tok)).d.coaches.some(c=>c.id===Uma.id));
r=await j("GET",`/api/search?q=${encodeURIComponent("Academy")}`,P.tok); t("search also matches the organization name",r.d.coaches.some(c=>c.id===Cleo.id),r.d.coaches.map(c=>c.displayName));
t("coaches don't get a coach list",(await j("GET",`/api/search?q=${encodeURIComponent("Cleo "+LAST)}`,Cora.tok)).d.coaches.length===0);
t("no emails in coach results",!JSON.stringify(found).includes("@"));
const apply=(tok,coachId)=>j("POST","/api/coach-applications",tok,{coachId});
t("an unverified coach cannot be applied to (404)",(await apply(P.tok,Uma.id)).s===404);
t("an athlete cannot apply to another athlete (404)",(await apply(P.tok,Q.id)).s===404);
t("a coach cannot apply (403)",(await apply(Cora.tok,Cleo.id)).s===403);
t("anonymous: 401",(await apply(null,Cleo.id)).s===401);
r=await apply(P.tok,Cleo.id); t("athlete shows interest → 201 'new'",r.s===201&&r.d.application.status==="new"&&r.d.application.coach.organization==="Cleo Academy",r);
t("a second time → 409 already_applied",(await apply(P.tok,Cleo.id)).d?.code==="already_applied");
r=await j("GET",`/api/search?q=${encodeURIComponent("Cleo "+LAST)}`,P.tok); t("search now shows 'applied'",r.d.coaches.find(c=>c.id===Cleo.id).relationship==="applied");
r=await j("GET","/api/coach-applications",P.tok); t("the athlete sees their own sent applications",r.d.sent.length===1&&r.d.sent[0].coach.id===Cleo.id,r.d);
t("an already-connected coach → 409 already_connected",(await apply(A.tok,Cora.id)).d?.code==="already_connected");
await apply(Q.tok,Cleo.id);
r=await j("GET","/api/coach-applications",Cleo.tok); const recv=r.d.received;
t("the coach sees both applicants (new first), with name, sport, school and relationship",recv.length===2&&recv.every(x=>x.status==="new"&&x.relationship==="none"&&x.hasShowcase===true&&x.athlete.school.startsWith("School")),recv);
t("no emails in the coach's list",!JSON.stringify(r.d).includes("@t.ph"));
let cn=await notes(Cleo,"application"); t("the coach was notified of each",cn.filter(x=>x.title==="New athlete application").length===2,cn);
t("another coach sees none of them",(await j("GET","/api/coach-applications",Cora.tok)).d.received.length===0);
t("an unverified coach cannot read the list (403)",(await j("GET","/api/coach-applications",Uma.tok)).s===403);
const app1=recv.find(x=>x.athlete.id===P.id).id;
t("bad status → 400",(await j("POST",`/api/coach-applications/${app1}/status`,Cleo.tok,{status:"accepted"})).s===400);
t("another coach cannot change it (404)",(await j("POST",`/api/coach-applications/${app1}/status`,Cora.tok,{status:"reviewed"})).s===404);
t("an athlete cannot change it (403)",(await j("POST",`/api/coach-applications/${app1}/status`,P.tok,{status:"reviewed"})).s===403);
t("coach marks one reviewed",(await j("POST",`/api/coach-applications/${app1}/status`,Cleo.tok,{status:"reviewed"})).s===200);
t("...and dismisses the other",(await j("POST",`/api/coach-applications/${recv.find(x=>x.athlete.id===Q.id).id}/status`,Cleo.tok,{status:"dismissed"})).s===200);
r=await j("GET","/api/coach-applications",Cleo.tok); t("statuses are saved",r.d.received.find(x=>x.id===app1).status==="reviewed"&&r.d.received.some(x=>x.status==="dismissed"),r.d.received.map(x=>x.status));
t("a dismissed athlete cannot spam again (409)",(await apply(Q.tok,Cleo.id)).d?.code==="already_applied");
r=await j("GET","/api/coach/dashboard",Cleo.tok); t("the coach dashboard 'new applications' count is real (0 left new)",r.s===200&&r.d.dashboard?.pendingActions?.newApplications===0||r.d?.pendingActions?.newApplications===0,r.d?.pendingActions||r.d?.dashboard?.pendingActions);
// connect from an application
r=await j("POST","/api/connections/requests",Cleo.tok,{userId:P.id}); t("coach can connect with an applicant",r.s===201,r);
r=await j("GET","/api/coach-applications",Cleo.tok); t("the application now shows the open request",r.d.received.find(x=>x.athlete.id===P.id).relationship==="request_sent");

// =============== 3. ADMIN VERIFICATION (API behind the new screen) ===============
const Dan=await coach("Dan",false);
const Adm=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:"Adm",lastName:LAST,email:`adm${ts}@t.ph`});
sql(`INSERT INTO user_roles (user_id, role_id, granted_at) SELECT '${Adm.d.user.id}', id, now() FROM roles WHERE name='admin'`);
const AdmTok=(await j("POST","/api/auth/login",null,{identifier:`adm${ts}@t.ph`,password:pw.password,remember:false})).d.token;
t("a coach cannot open the admin list (403)",(await j("GET","/api/admin/coach-verifications",Dan.tok)).s===403);
t("an athlete cannot (403)",(await j("GET","/api/admin/coach-verifications",P.tok)).s===403);
// the coach submits their details for verification, as the coach screen does
r=await j("PUT","/api/coach/profile",Dan.tok,{firstName:"Dan",lastName:LAST,email:Dan.email,organizationName:"Dan Academy",organizationType:"University",organizationLocation:"Surigao City",positionTitle:"Head coach",programName:"Dan Eagles",primarySport:"Basketball",competitionLevel:"Collegiate",yearsExperience:"5",background:"I have coached varsity basketball teams for five years and run summer camps for local students.",certifications:"",officialEmail:"dan@school.edu",credentialType:"Coaching license",credentialReference:"LIC-7"});
if(r.s!==200) console.log("COACH PROFILE SAVE FAILED",r.s,JSON.stringify(r.d));
r=await j("POST","/api/coach/verification/request",Dan.tok); t("coach submits a verification request",r.s===200,r);
r=await j("GET","/api/admin/coach-verifications?status=pending&limit=100",AdmTok); const mine=(r.d.items||[]).find(x=>x.coachId===Dan.id);
t("admin sees the pending request with the credential details",r.s===200&&mine&&mine.organization==="Dan Academy"&&mine.credentialType==="Coaching license"&&mine.officialEmail==="dan@school.edu"&&mine.status==="pending",mine||r.d);
t("rejecting needs a reason (4xx)",(await j("POST",`/api/admin/coach-verifications/${Dan.id}/reject`,AdmTok,{note:""})).s>=400);
r=await j("POST",`/api/admin/coach-verifications/${Dan.id}/reject`,AdmTok,{note:"Credential photo is unreadable"}); t("admin rejects with a reason",r.s===200,r);
cn=await notes(Dan,"verification"); t("the coach is told why",cn.some(x=>x.title==="Verification not approved"&&/unreadable/.test(x.message)),cn);
r=await j("GET","/api/admin/coach-verifications?status=rejected&limit=100",AdmTok); t("rejected tab lists it with the reason",(r.d.items||[]).some(x=>x.coachId===Dan.id&&/unreadable/.test(x.note)),r.d);
await j("POST","/api/coach/verification/request",Dan.tok);
r=await j("POST",`/api/admin/coach-verifications/${Dan.id}/approve`,AdmTok,{}); t("admin approves after resubmission",r.s===200,r);
cn=await notes(Dan,"verification"); t("the coach is notified they are verified",cn.some(x=>x.title==="You're verified"),cn);
const DanTok=(await j("POST","/api/auth/login",null,{identifier:Dan.email,password:pw.password,remember:false})).d.token;
t("an approved coach can now use recruiting",(await j("GET","/api/recruiting/athletes?q="+LAST,DanTok)).s===200);
// admin landing
const roles=await import(new URL("../src/lib/roles.ts",import.meta.url).href);
t("an administrator lands on the verification screen",roles.homePathFor(["admin"])==="/admin/verifications");
t("other roles are unchanged",roles.homePathFor(["coach"])==="/coach/dashboard"&&roles.homePathFor(["university_representative"])==="/scholarships"&&roles.homePathFor(["student_athlete"])==="/dashboard");
console.log(`\n${pass} passed, ${fail} failed`);
