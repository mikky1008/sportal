// Run against a THROWAWAY local Postgres only. It needs psql access as the postgres user; edit the sql() helper for your setup.
import { execSync } from "node:child_process";
const B="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(B+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const reg=(b)=>j("POST","/api/auth/register",null,{...pw,...b});
const login=async(e)=>(await j("POST","/api/auth/login",null,{identifier:e,password:pw.password,remember:false})).d.token;

// seed script: adds 4, then 0 on a second run
const seed=()=>execSync(`cd /home/claude/p/sportal-main && DATABASE_URL=postgres://postgres@localhost:5544/sportal node --experimental-strip-types --no-warnings scripts/seed-scholarships.ts`).toString().trim();
t("seed adds 4", /Added 4 scholarship/.test(seed()));
t("seed is idempotent", /Added 0 scholarship/.test(seed()));

const ath=await reg({accountType:"student_athlete",firstName:"Gia",lastName:"Reyes",email:`gia${ts}@t.ph`});
const rep=await reg({accountType:"university_representative",firstName:"Rex",lastName:"Rep",email:`rex${ts}@t.ph`,university:"Rep Univ",designation:"Director"});
const rep2=await reg({accountType:"university_representative",firstName:"Rio",lastName:"Other",email:`rio${ts}@t.ph`,university:"Other Univ",designation:"Director"});
const A=ath.d.token,R=rep.d.token,R2=rep2.d.token;

// seeded list
let r=await j("GET","/api/scholarships",A);
const seeded=r.d.items.filter(i=>["National University","De La Salle University","University of Santo Tomas","UP Diliman"].includes(i.university));
t("seeded scholarships listed", seeded.length===4 && seeded.every(i=>i.eligibility.length>=2 && i.postedByMe===false), r.d.items.map(i=>i.name));
// universities endpoint
r=await j("GET","/api/scholarships/universities",A);
t("universities endpoint", r.s===200 && r.d.items.includes("UP Diliman") && r.d.items.includes("National University"), r);
t("universities needs sign-in", (await j("GET","/api/scholarships/universities")).s===401);

// rep posts, owns it, sees own closed one
const body={name:"Rep Univ Grant",sport:"Basketball",coverage:"Full",details:"",eligibility:["Be good"],deadline:"2099-01-01"};
r=await j("POST","/api/scholarships",R,body); const sid=r.d.scholarship.id;
t("postedByMe true for poster", r.d.scholarship.postedByMe===true && r.d.scholarship.university==="Rep Univ", r);
r=await j("GET","/api/scholarships",A); t("postedByMe false for athlete", r.d.items.find(i=>i.id===sid)?.postedByMe===false);
r=await j("POST",`/api/scholarships/${sid}/close`,R2); t("other rep cannot close", r.s===404, r);
r=await j("POST",`/api/scholarships/${sid}/close`,R); t("poster closes", r.s===200 && r.d.scholarship.isOpen===false);
r=await j("GET","/api/scholarships",R); t("closed hidden by default", !r.d.items.some(i=>i.id===sid));
r=await j("GET","/api/scholarships?includeClosed=true",R); t("poster sees own closed", r.d.items.some(i=>i.id===sid));
r=await j("GET","/api/scholarships?includeClosed=true",R2); t("other rep does NOT see it", !r.d.items.some(i=>i.id===sid));
r=await j("GET","/api/scholarships?includeClosed=true",A); t("athlete includeClosed ignored", !r.d.items.some(i=>i.id===sid));
r=await j("POST",`/api/scholarships/${sid}/open`,R); t("poster reopens", r.s===200 && r.d.scholarship.isOpen===true);
r=await j("GET","/api/scholarships/universities",A); t("new university appears", r.d.items.includes("Rep Univ"), r);

// gap 4: athlete picks real universities (profile extras API, migration 6 intact)
r=await j("GET","/api/athletes/me/extras",A); t("extras GET works (migration 6 present)", r.s===200, r);
r=await j("PUT","/api/athletes/me/extras/scholarship",A,{universities:["UP Diliman","Rep Univ"],coverage:"Full tuition",course:"BS CS"}); t("pick real universities OK", r.s===200 && r.d.extras.scholarship.universities.length===2, r);
r=await j("PUT","/api/athletes/me/extras/scholarship",A,{universities:["Made Up University"],coverage:"",course:""}); t("unknown university rejected", r.s>=400 && r.s<500, r);
r=await j("PUT","/api/athletes/me/extras/scholarship",A,{universities:["UP Diliman","UP Diliman"],coverage:"",course:""}); t("duplicate rejected", r.s>=400 && r.s<500, r);
r=await j("GET","/api/athletes/me/sessions",A); t("sessions GET works (migration 6 present)", r.s===200, r);
r=await j("GET","/api/athletes/me/profile",A); t("profile GET works", r.s===200, r);

// gap 2: connection + verification notifications
const coach=await reg({accountType:"coach",firstName:"Cora",lastName:"Coach",email:`cora${ts}@t.ph`,organization:"Test U",position:"Head coach",sport:"Basketball"});
const C=coach.d.token; const coachId=coach.d.user.id; const athId=ath.d.user.id;
sql(`INSERT INTO coach_verifications (coach_id,status,organization,official_email,credential_type,credential_reference,submitted_at,updated_at) VALUES ('${coachId}','pending','Test U','cora@test.edu','Coaching license','LIC-1',now(),now())`);
// approve through the real code path (the same function the admin API and CLI use)
execSync(`cd /home/claude/p/sportal-main && DATABASE_URL=postgres://postgres@localhost:5544/sportal node --experimental-strip-types --no-warnings -e "import('./server/coach-profile.server.ts').then(async m=>{const {getDb,closeDb}=await import('./server/db.server.ts');await m.applyReview(await getDb(),{coachId:'${coachId}',decision:'approve',note:'',reviewerId:null});await closeDb()})"`);
const C2=await login(`cora${ts}@t.ph`);
r=await j("GET","/api/notifications?category=verification",C2); t("coach notified: verified", r.d.items.length===1 && r.d.items[0].title==="You're verified" && r.d.unread===1, r);
r=await j("POST","/api/connections/requests",C2,{userId:athId}); const cid=r.d?.connection?.id; t("coach sends request", r.s===201, r);
r=await j("GET","/api/notifications?category=connection",A); t("athlete notified of request", r.d.items.length===1 && /Cora Coach/.test(r.d.items[0].message), r);
r=await j("POST",`/api/connections/requests/${cid}/accept`,A); t("athlete accepts", r.s===200, r);
r=await j("GET","/api/notifications?category=connection",C2); t("coach notified of acceptance", r.d.items.some(i=>i.title==="Connection accepted"), r);
// a second pair for decline + athlete-initiated
const ath3=await reg({accountType:"student_athlete",firstName:"Dan",lastName:"Soto",email:`dan${ts}@t.ph`});
r=await j("POST","/api/connections/requests",ath3.d.token,{userId:coachId}); const cid2=r.d?.connection?.id; t("athlete sends request to verified coach", r.s===201, r);
r=await j("GET","/api/notifications?category=connection",C2); t("coach notified of athlete's request", r.d.items.some(i=>/Dan Soto/.test(i.message)), r.d);
r=await j("POST",`/api/connections/requests/${cid2}/decline`,C2); t("coach declines", r.s===200, r);
r=await j("GET","/api/notifications?category=connection",ath3.d.token); t("athlete notified of decline", r.d.items.some(i=>i.title==="Connection declined"), r);
// no notification leakage between users
r=await j("GET","/api/notifications",R); t("unrelated rep has no connection notifications", !r.d.items.some(i=>i.category==="connection"), r);
// rejected verification includes the reason
sql(`UPDATE coach_verifications SET status='pending', reviewed_at=NULL WHERE coach_id='${coachId}'`);
execSync(`cd /home/claude/p/sportal-main && DATABASE_URL=postgres://postgres@localhost:5544/sportal node --experimental-strip-types --no-warnings -e "import('./server/coach-profile.server.ts').then(async m=>{const {getDb,closeDb}=await import('./server/db.server.ts');await m.applyReview(await getDb(),{coachId:'${coachId}',decision:'reject',note:'Credential unreadable',reviewerId:null});await closeDb()})"`);
r=await j("GET","/api/notifications?category=verification",C2); t("rejection notification carries reason", r.d.items.some(i=>i.title==="Verification not approved" && /Credential unreadable/.test(i.message)), r);
console.log(`\n${pass} passed, ${fail} failed`);
