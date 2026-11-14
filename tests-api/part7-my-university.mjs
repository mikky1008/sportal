// Run against a THROWAWAY local Postgres only (it creates users and edits rows by SQL). Needs psql access as the postgres user; edit the sql() helper for your setup. API at http://localhost:8799.
import { execSync } from "node:child_process";
const BASE="http://localhost:8799";
const DB="postgres://postgres@localhost:5544/sportal";
const j=async(m,p,t,b)=>{const r=await fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
await j("POST","/api/auth/login",null,{identifier:"warmup",password:"x"});
sql("DELETE FROM signup_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const LAST="Uni"+ts;
const UNI="Test State University "+ts;

// ----- helpers: everything goes through the real endpoints -----
const adminTok=(await j("POST","/api/admin/auth/login",null,{identifier:process.env.ADMIN_EMAIL||"admin@sportal.test",password:process.env.ADMIN_PASSWORD||"Adm1n-Secret-Pass"})).d.token; // the predefined administrator, via its own sign-in
const coach=async(first,{org=UNI,type="University",location="Surigao City",sport="Basketball",position="Head coach",submit=true,decision="approve"}={})=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`,organization:org,position:"Head coach",sport});
  const id=r.d.user.id;
  let tok=(await j("POST","/api/auth/login",null,{identifier:`${first.toLowerCase()}${ts}@t.ph`,password:pw.password,remember:false})).d.token;
  const put=await j("PUT","/api/coach/profile",tok,{firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`,organizationName:org,organizationType:type,organizationLocation:location,positionTitle:position,programName:first+" Eagles",primarySport:sport,competitionLevel:"Collegiate",yearsExperience:"5",background:"I have coached varsity teams for five years and run camps for local students.",certifications:"",officialEmail:`${first.toLowerCase()}@school.edu`,credentialType:"Coaching license",credentialReference:"LIC-"+first});
  if(put.s!==200) console.log("COACH PROFILE FAILED",first,put.s,JSON.stringify(put.d));
  if(submit){
    const rq=await j("POST","/api/coach/verification/request",tok); if(rq.s!==200) console.log("REQUEST FAILED",first,rq.s,JSON.stringify(rq.d));
    if(decision==="approve") await j("POST",`/api/admin/coach-verifications/${id}/approve`,adminTok,{});
    if(decision==="reject") await j("POST",`/api/admin/coach-verifications/${id}/reject`,adminTok,{note:"Not enough proof"});
    tok=(await j("POST","/api/auth/login",null,{identifier:`${first.toLowerCase()}${ts}@t.ph`,password:pw.password,remember:false})).d.token; // roles are read at sign-in
  }
  return {id,tok};
};
const athlete=async(first,sport="Basketball",position="Guard")=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`});
  await j("PUT","/api/athletes/me/profile",r.d.token,{firstName:first,lastName:LAST,sport,position,school:UNI,municipality:"",year:"",heightCm:"",weightKg:"",teamStatus:"",teamName:"",bio:"",achievements:[]});
  return {id:r.d.user.id,tok:r.d.token};
};
const connect=async(c,a)=>{const r=await j("POST","/api/connections/requests",c.tok,{userId:a.id});const acc=await j("POST",`/api/connections/requests/${r.d.connection.id}/accept`,a.tok);return acc.s===200;};
const info=(tok)=>j("GET","/api/coach/university",tok);
const coaches=(tok,qs="")=>j("GET","/api/coach/university/coaches"+qs,tok);
const athletes=(tok,qs="")=>j("GET","/api/coach/university/athletes"+qs,tok);

// ===== a fresh database has no universities: nothing is hard-coded =====
t("no university exists before anyone is approved",sql("SELECT count(*) FROM universities WHERE name LIKE 'Test State%'")==="0");

// ===== coaches (every one goes through the real verify flow) =====
const C1=await coach("Cora");                                            // approved, university
const C2=await coach("Cass",{org:`  ${UNI.toUpperCase()}  `,sport:"Volleyball",position:"Assistant coach"}); // same university, different spelling
const C3=await coach("Cleo",{org:"Other State University "+ts,location:"Butuan"});   // different university
const C4=await coach("Chip",{org:"Hilltop High "+ts,type:"High school"}); // approved, but not a university
const C5=await coach("Cyd",{decision:"none"});                           // pending (not approved)
const C6=await coach("Cole",{decision:"reject"});                        // rejected
const C7=await coach("Cam",{submit:false});                              // never asked
const C8=await coach("Cody");                                            // approved, will be deactivated
const C9=await coach("Cree");                                            // approved, will be revoked later

t("approving coaches from one university created exactly ONE university row (names match without case/edge spaces)",sql(`SELECT count(*) FROM universities WHERE name_key = lower('${UNI}')`)==="1");
t("the university name is stored tidy (trimmed, as the first coach wrote it)",sql(`SELECT name FROM universities WHERE name_key = lower('${UNI}')`)===UNI);
t("a high-school coach does not create a university",sql(`SELECT count(*) FROM universities WHERE name_key = lower('Hilltop High ${ts}')`)==="0");
t("each approved coach is linked to their university",sql(`SELECT count(*) FROM coach_profiles WHERE university_id IS NOT NULL AND user_id IN ('${C1.id}','${C2.id}','${C8.id}','${C9.id}')`)==="4");
t("pending / rejected / never-asked coaches are NOT linked",sql(`SELECT count(*) FROM coach_profiles WHERE university_id IS NOT NULL AND user_id IN ('${C4.id}','${C5.id}','${C6.id}','${C7.id}')`)==="0");

// ===== access control =====
t("anonymous → 401",(await j("GET","/api/coach/university")).s===401&&(await j("GET","/api/coach/university/coaches")).s===401&&(await j("GET","/api/coach/university/athletes")).s===401);
const A1=await athlete("Ann");
const rep=await j("POST","/api/auth/register",null,{...pw,accountType:"university_representative",firstName:"Rex",lastName:LAST,email:`rex${ts}@t.ph`,university:UNI,designation:"Director"});
for(const [who,tok] of [["an athlete",A1.tok],["a university representative",rep.d.token],["an administrator",adminTok]]){
  t(`${who} cannot open any of the three endpoints (403)`,[info(tok),coaches(tok),athletes(tok)].length&&(await info(tok)).s===403&&(await coaches(tok)).s===403&&(await athletes(tok)).s===403);
}
// read-only: nothing can change a university or another coach through these paths
for(const m of ["PUT","POST","PATCH","DELETE"]) for(const p of ["/api/coach/university","/api/coach/university/coaches","/api/coach/university/athletes"]){
  const r=await j(m,p,C1.tok,{name:"Hacked",description:"x"}); if(r.s<400||r.s>=500) console.log("WRITE NOT BLOCKED",m,p,r.s);
}
t("PUT/POST/PATCH/DELETE on all three paths are refused (404/405, never 2xx)",(await Promise.all(["PUT","POST","PATCH","DELETE"].flatMap(m=>["/api/coach/university","/api/coach/university/coaches","/api/coach/university/athletes"].map(p=>j(m,p,C1.tok,{name:"Hacked"}))))).every(r=>r.s>=400&&r.s<500));
t("the database was not changed by those attempts",sql(`SELECT count(*) FROM universities WHERE name='Hacked'`)==="0");
t("the university id cannot be chosen by the caller (query params are ignored)",(await j("GET",`/api/coach/university?universityId=other&id=x`,C1.tok)).d.university.name===UNI);

// ===== 1. university information =====
let r=await info(C1.tok);
t("coach 1 gets their university (name + location from the approved profile)",r.s===200&&r.d.affiliated===true&&r.d.university.name===UNI&&r.d.university.location==="Surigao City",r.d);
t("no logo / description / website yet → empty strings, not sample text",r.d.university.logoUrl===""&&r.d.university.description===""&&r.d.university.website==="",r.d.university);
r=await info(C3.tok); t("coach 3 sees THEIR university, not coach 1's",r.d.university.name==="Other State University "+ts&&r.d.university.location==="Butuan",r.d);
r=await info(C5.tok); t("a pending coach: affiliated=false, reason not_verified",r.s===200&&r.d.affiliated===false&&r.d.reason==="not_verified"&&r.d.university===undefined,r.d);
r=await info(C6.tok); t("a rejected coach: not_verified",r.d.affiliated===false&&r.d.reason==="not_verified",r.d);
r=await info(C7.tok); t("a coach who never asked: not_verified",r.d.affiliated===false&&r.d.reason==="not_verified",r.d);
r=await info(C4.tok); t("an approved coach whose organization is a high school: no_university",r.d.affiliated===false&&r.d.reason==="no_university",r.d);
t("no emails anywhere in the university response",!JSON.stringify(await info(C1.tok)).includes("@"));
// the admin CLI fills in the details coaches cannot edit
const cli=execSync(`cd /home/claude/p/sportal-main && DATABASE_URL=${DB} node --experimental-strip-types --no-warnings scripts/set-university.ts set "${UNI}" --logo https://example.edu/logo.png --location "Surigao City, Philippines" --description "A state university in Mindanao." --website https://example.edu 2>&1`).toString();
t("the command-line tool saves details for an existing university (matched case-insensitively)",/Saved/.test(cli)&&sql(`SELECT count(*) FROM universities WHERE name_key = lower('${UNI}')`)==="1",cli);
r=await info(C1.tok); t("the page data now carries logo, location, description and website from the database",r.d.university.logoUrl==="https://example.edu/logo.png"&&r.d.university.location==="Surigao City, Philippines"&&r.d.university.description==="A state university in Mindanao."&&r.d.university.website==="https://example.edu",r.d.university);
r=await info(C2.tok); t("a colleague (spelled the name differently) sees the same university details",r.d.university.name===UNI&&r.d.university.logoUrl==="https://example.edu/logo.png",r.d);
const bad=(()=>{try{execSync(`cd /home/claude/p/sportal-main && DATABASE_URL=${DB} node --experimental-strip-types --no-warnings scripts/set-university.ts set "${UNI}" --logo javascript:alert(1) 2>&1`);return "accepted";}catch(e){return "refused";}})();
t("the tool refuses a non-http(s) logo link",bad==="refused");

// ===== 2. university coaches =====
r=await coaches(C1.tok); let names=r.d.items.map(x=>x.name.split(" ")[0]).sort().join();
t("coach list = approved coaches of THIS university only (Cora, Cass, Cody, Cree)",r.s===200&&names==="Cass,Cody,Cora,Cree",names);
t("excludes other universities, a high school, pending, rejected and never-asked coaches",!/Cleo|Chip|Cyd|Cole|Cam/.test(names));
const cass=r.d.items.find(x=>x.name.startsWith("Cass")); const cora=r.d.items.find(x=>x.name.startsWith("Cora"));
t("each coach shows name, sport, position and account status",cass.sport==="Volleyball"&&cass.position==="Assistant coach"&&cass.status==="verified"&&cass.accountStatus==="active"&&cora.sport==="Basketball"&&cora.position==="Head coach",[cass,cora]);
t("the signed-in coach is marked 'you'",cora.isYou===true&&cass.isYou===false);
t("no emails in the coach list",!JSON.stringify(r.d).includes("@"));
t("total matches",r.d.total===4);
r=await coaches(C3.tok); t("another university's coach sees only their own colleagues (just themselves)",r.d.items.length===1&&r.d.items[0].name.startsWith("Cleo"),r.d.items.map(x=>x.name));
r=await coaches(C5.tok); t("an unverified coach gets an empty list and the reason",r.s===200&&r.d.affiliated===false&&r.d.items.length===0&&r.d.total===0&&r.d.reason==="not_verified",r.d);
sql(`UPDATE users SET is_active=FALSE WHERE id='${C8.id}'`);
r=await coaches(C1.tok); t("a deactivated coach account disappears from the list",!r.d.items.some(x=>x.name.startsWith("Cody")),r.d.items.map(x=>x.name));
// revoke Cree through the real admin endpoint
await j("POST",`/api/admin/coach-verifications/${C9.id}/reject`,adminTok,{note:"Revoked"});
r=await coaches(C1.tok); t("a coach whose approval is withdrawn disappears from the list",!r.d.items.some(x=>x.name.startsWith("Cree")),r.d.items.map(x=>x.name));
t("...and their university link is cleared",sql(`SELECT university_id IS NULL FROM coach_profiles WHERE user_id='${C9.id}'`)==="t");
r=await info((await j("POST","/api/auth/login",null,{identifier:`cree${ts}@t.ph`,password:pw.password,remember:false})).d.token); t("...and they no longer see the university",r.d.affiliated===false,r.d);
r=await coaches(C1.tok,"?q=cas"); t("search by name",r.d.items.length===1&&r.d.items[0].name.startsWith("Cass")&&r.d.total===1,r.d.items.map(x=>x.name));
r=await coaches(C1.tok,"?limit=1&offset=1"); t("limit/offset with a correct total (Cass, Cora left = 2)",r.d.items.length===1&&r.d.total===2,{n:r.d.items.length,t:r.d.total});
t("a silly limit is clamped, not an error",(await coaches(C1.tok,"?limit=99999&offset=-5")).s===200);

// ===== 3. university athletes (approved affiliation = accepted connection with a verified coach of this university) =====
const Ath={}; for(const [n,sport,pos] of [["Aaa","Basketball","Guard"],["Bbb","Volleyball","Setter"],["Ccc","Basketball","Forward"],["Ddd","Basketball","Center"],["Eee","Basketball","Guard"],["Fff","Basketball","Guard"],["Ggg","Basketball","Guard"],["Hhh","Basketball","Guard"]]) Ath[n]=await athlete(n,sport,pos);
t("A connects with coach 1",await connect(C1,Ath.Aaa));
t("B connects with colleague coach 2",await connect(C2,Ath.Bbb));
t("C connects with coach 3 (other university)",await connect(C3,Ath.Ccc));
// D: only a PENDING request to coach 1
await j("POST","/api/connections/requests",C1.tok,{userId:Ath.Ddd.id});
// E: hidden showcase, connected to colleague coach 2
t("E connects with colleague coach 2",await connect(C2,Ath.Eee)); await j("PUT","/api/athletes/me/visibility",Ath.Eee.tok,{visible:false});
// F: hidden showcase, connected to coach 1 directly
t("F connects with coach 1",await connect(C1,Ath.Fff)); await j("PUT","/api/athletes/me/visibility",Ath.Fff.tok,{visible:false});
// G: connected to coach 1 then disconnected
t("G connects then is removed by coach 1",await connect(C1,Ath.Ggg)); 
const gConn=sql(`SELECT id FROM coach_athlete_connections WHERE athlete_id='${Ath.Ggg.id}'`); await j("POST",`/api/connections/${gConn}/disconnect`,C1.tok);
// H: declares the university as their school but has NO connection (self-declared only)
r=await athletes(C1.tok); names=r.d.items.map(x=>x.name.split(" ")[0]).sort().join();
t("coach 1 sees: A (own), B (colleague's), F (own, hidden showcase)",r.s===200&&names==="Aaa,Bbb,Fff",names);
t("NOT shown: C (other university), D (pending), E (hidden + only a colleague's), G (disconnected), H (just says the school)",!/Ccc|Ddd|Eee|Ggg|Hhh/.test(names),names);
const bb=r.d.items.find(x=>x.name.startsWith("Bbb"));
t("each athlete shows name, sport, position and affiliation status",bb.sport==="Volleyball"&&bb.position==="Setter"&&bb.affiliationStatus==="approved"&&!isNaN(Date.parse(bb.affiliatedSince)),bb);
t("no emails in the athlete list",!JSON.stringify(r.d).includes("@"));
r=await athletes(C2.tok); names=r.d.items.map(x=>x.name.split(" ")[0]).sort().join();
t("coach 2 sees: A, B, E (own hidden one) — but NOT F (hidden, connected only to a colleague)",names==="Aaa,Bbb,Eee",names);
r=await athletes(C3.tok); t("coach 3 (other university) sees only their own athlete, never ours",r.d.items.length===1&&r.d.items[0].name.startsWith("Ccc"),r.d.items.map(x=>x.name));
r=await athletes(C5.tok); t("an unverified coach gets an empty list and the reason",r.d.affiliated===false&&r.d.items.length===0&&r.d.reason==="not_verified",r.d);
r=await athletes(C4.tok); t("a high-school coach gets nothing (no_university)",r.d.affiliated===false&&r.d.reason==="no_university"&&r.d.items.length===0,r.d);
// a second coach of the university also connected to A must not duplicate A
t("A also connects with coach 2",await connect(C2,Ath.Aaa));
r=await athletes(C1.tok); t("an athlete connected to two coaches of the university is listed once",r.d.items.filter(x=>x.name.startsWith("Aaa")).length===1&&r.d.total===3,{n:r.d.items.length,total:r.d.total});
r=await athletes(C1.tok,"?q=bb"); t("search by name",r.d.items.length===1&&r.d.items[0].name.startsWith("Bbb"),r.d.items.map(x=>x.name));
r=await athletes(C1.tok,"?limit=2&offset=0"); t("paging with an exact total",r.d.items.length===2&&r.d.total===3);
// withdrawing the colleague's approval removes athletes who were only connected through them
await j("POST",`/api/admin/coach-verifications/${C2.id}/reject`,adminTok,{note:"Revoked"});
r=await athletes(C1.tok); names=r.d.items.map(x=>x.name.split(" ")[0]).sort().join(); t("when coach 2's approval is withdrawn, B (only connected through them) leaves; A stays (also coach 1's)",names==="Aaa,Fff",names);
// deactivated athlete
sql(`UPDATE users SET is_active=FALSE WHERE id='${Ath.Aaa.id}'`); r=await athletes(C1.tok); t("a deactivated athlete account is not listed",!r.d.items.some(x=>x.name.startsWith("Aaa")),r.d.items.map(x=>x.name));

// ===== the migration's backfill (coaches approved before this feature existed) =====
const mig=execSync(`cd /home/claude/p/sportal-main && sed -n '/-- backfill start/,/-- backfill end/p' server/db.server.ts`).toString();
sql(`UPDATE coach_profiles SET university_id=NULL`); sql(`DELETE FROM universities`);
execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -q"`,{input:mig});
t("backfill: the university comes back for coaches who were already approved (one row, name + location)",sql(`SELECT count(*) FROM universities WHERE name_key=lower('${UNI}')`)==="1"&&sql(`SELECT location FROM universities WHERE name_key=lower('${UNI}')`)!=="");
t("backfill: approved university coaches are re-linked; the rejected, pending and high-school ones are not",sql(`SELECT count(*) FROM coach_profiles WHERE university_id IS NOT NULL AND user_id IN ('${C1.id}')`)==="1"&&sql(`SELECT count(*) FROM coach_profiles WHERE university_id IS NOT NULL AND user_id IN ('${C4.id}','${C5.id}','${C6.id}','${C7.id}','${C2.id}','${C9.id}')`)==="0");
console.log(`\n${pass} passed, ${fail} failed`);
