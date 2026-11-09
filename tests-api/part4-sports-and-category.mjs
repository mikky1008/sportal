// Run against a THROWAWAY local Postgres only (it creates users and edits rows by SQL). Needs psql access as the postgres user; edit the sql() helper for your setup. API at http://localhost:8799.
import { execSync } from "node:child_process";
const B="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(B+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
sql("DELETE FROM signup_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const LAST="Spt"+ts;
const mk=async(first,sport,extra={})=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`});
  const body={firstName:first,lastName:LAST,sport,position:"",school:"School X",municipality:"Tubod",year:"",heightCm:"",weightKg:"",teamStatus:"",teamName:"",bio:"",achievements:[],...extra};
  const put=await j("PUT","/api/athletes/me/profile",r.d.token,body);
  if(put.s!==200) console.log("PROFILE SAVE FAILED",put.s,JSON.stringify(put.d));
  return {id:r.d.user.id,tok:r.d.token,body};
};
// a manual result, optionally asking a coach to verify (the only way these sports can count)
const manual=(a,skill,result,ask=true)=>j("POST","/api/athletes/me/sessions",a.tok,{skill,result,source:"manual",consistency:null,...(ask?{requestedReview:true}:{})});
const verifyAll=(a)=>sql(`UPDATE practice_sessions SET status='coach_verified', verified_at=now() WHERE athlete_id='${a.id}' AND status='pending_review'`);

// ================= CATEGORY =================
const C1=await mk("Cat1","Basketball",{category:"Men's Collegiate"});
const C2=await mk("Cat2","Basketball",{category:"Women's Collegiate"});
const C3=await mk("Cat3","Basketball",{category:"Juniors"});
const C4=await mk("Cat4","Basketball",{});
let r=await j("GET","/api/athletes/me/profile",C1.tok); t("category is saved and returned",r.d.profile.category==="Men's Collegiate",r.d.profile);
r=await j("GET","/api/athletes/me/profile",C4.tok); t("no category chosen → empty",r.d.profile.category==="",r.d.profile);
r=await j("PUT","/api/athletes/me/profile",C1.tok,{...C1.body,category:"Seniors 40+"}); t("unknown category rejected",r.s>=400&&r.s<500&&/categor/i.test(JSON.stringify(r.d)),r);
const {category:_c,...noCat}=C1.body;
r=await j("PUT","/api/athletes/me/profile",C1.tok,noCat); t("older client (no category key) keeps it",r.s===200&&r.d.profile.category==="Men's Collegiate",r.d);
r=await j("PUT","/api/athletes/me/profile",C1.tok,{...C1.body,category:""}); t("empty string clears it",r.d.profile.category==="",r.d);
await j("PUT","/api/athletes/me/profile",C1.tok,C1.body);
for(const a of [C1,C2,C3,C4]) for(let i=0;i<3;i++) await j("POST","/api/athletes/me/sessions",a.tok,{skill:"shooting",result:80,consistency:70,source:"ai"});
const rk=(tok,qs)=>j("GET",`/api/rankings?sport=Basketball&metric=Shooting%20Accuracy${qs}`,tok);
const mine=(res)=>res.d.rows.filter(x=>[C1.id,C2.id,C3.id,C4.id].includes(x.athleteId)).map(x=>x.athleteName.split(" ")[0]).sort().join();
r=await rk(C4.tok,""); t("no category filter → all four",mine(r)==="Cat1,Cat2,Cat3,Cat4",mine(r));
r=await rk(C4.tok,"&category=Men's%20Collegiate"); t("category filter: Men's Collegiate → Cat1 only",mine(r)==="Cat1",mine(r));
r=await rk(C4.tok,"&category=Juniors"); t("category filter: Juniors → Cat3 only",mine(r)==="Cat3",mine(r));
r=await rk(C4.tok,"&category=All"); t("'All' means no filter",mine(r)==="Cat1,Cat2,Cat3,Cat4",mine(r));
t("unknown category → 400",(await rk(C4.tok,"&category=Nope")).s===400);
r=await rk(C4.tok,"&category=Juniors"); t("athlete with no category: not in a filtered view (no 'me')",r.d.me===undefined||r.d.me.row===null,r.d.me);

// ================= SPORT RULES =================
const V1=await mk("Vol1","Volleyball"), V2=await mk("Vol2","Volleyball"), V3=await mk("Vol3","Volleyball"), V4=await mk("Vol4","Volleyball");
const T1=await mk("Trk1","Track & Field"), T2=await mk("Trk2","Track & Field");
const B1=await mk("Bkb1","Basketball");
r=await j("POST","/api/athletes/me/sessions",V1.tok,{skill:"shooting",result:80,consistency:70,source:"ai"}); t("volleyball athlete cannot log a basketball skill",r.s>=400&&r.s<500&&/Basketball skill/.test(JSON.stringify(r.d)),r);
r=await manual(B1,"spiking",80); t("basketball athlete cannot log a volleyball skill",r.s>=400&&r.s<500,r);
r=await manual(T1,"spiking",80); t("track athlete cannot log a volleyball skill",r.s>=400&&r.s<500,r);
r=await manual(V1,"spiking",101); t("spiking above 100 rejected",r.s>=400&&r.s<500,r);
r=await manual(T1,"sprint100",4.2); t("sprint faster than 5s rejected",r.s>=400&&r.s<500&&/between 5 and 60/.test(JSON.stringify(r.d)),r);
r=await manual(T1,"sprint100",61); t("sprint slower than 60s rejected",r.s>=400&&r.s<500,r);
r=await manual(V1,"spiking",80,true); t("hand-entered + review asked → Pending Review",r.s===201&&r.d.session.status==="Pending Review",r);
r=await manual(V1,"spiking",80,false); t("hand-entered, no review asked → Self-Reported",r.s===201&&r.d.session.status==="Self-Reported",r);
const noSport=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:"Nos",lastName:LAST,email:`nos${ts}@t.ph`});
r=await j("POST","/api/athletes/me/sessions",noSport.d.token,{skill:"shooting",result:50,consistency:50,source:"ai"}); t("athlete who has not chosen a sport can still log (unchanged)",r.s===201,r);

// ================= VOLLEYBALL RANKINGS =================
for(const [a,v,n] of [[V1,80,3],[V2,70,3],[V3,90,3],[V4,95,2]]) for(let i=0;i<n;i++) await manual(a,"spiking",v,a!==V3);
// V1 already has 2 sessions from above (1 pending + 1 self-reported); the 3 verified ones are what count
for(let i=0;i<3;i++) await manual(V1,"serving",60,true);
for(const a of [V1,V2,V4]) verifyAll(a);
const vr=(tok,metric)=>j("GET",`/api/rankings?sport=Volleyball&metric=${encodeURIComponent(metric)}`,tok);
const vmine=(res)=>res.d.rows.filter(x=>[V1.id,V2.id,V3.id,V4.id].includes(x.athleteId));
r=await vr(V3.tok,"Spike Accuracy");
const rows=vmine(r);
t("spiking: Vol1 (80) #1 and Vol2 (70) #2 among ours",rows.length===2&&rows[0].athleteId===V1.id&&rows[0].value===80&&rows[1].athleteId===V2.id&&rows[1].value===70,rows);
t("self-reported spiking (Vol3, 90) never counts",!rows.some(x=>x.athleteId===V3.id));
t("Vol4 has only 2 verified → not ranked",!rows.some(x=>x.athleteId===V4.id));
t("Vol1's pending/self-reported sessions did not change the average (still 80)",rows[0].value===80,rows[0]);
t("verified sessions are tagged",rows[0].verifiedSessions>=3,rows[0]);
t("Vol3's own view: not ranked, counted 0",r.d.me?.row===null&&r.d.me.counted===0,r.d.me);
r=await vr(V1.tok,"Serve Accuracy"); t("serve accuracy is its own metric (Vol1 60)",vmine(r).length===1&&vmine(r)[0].athleteId===V1.id&&vmine(r)[0].value===60,vmine(r));
r=await j("GET","/api/rankings?sport=Volleyball&metric=Shooting%20Accuracy",V1.tok); t("a basketball metric is not valid for volleyball (400)",r.s===400,r);
r=await j("GET","/api/rankings/headline",V1.tok); t("headline for a volleyball athlete = Spike Accuracy rank",r.d.me?.metric==="Spike Accuracy"&&r.d.me.position>=1,r.d.me);
r=await j("GET","/api/rankings/headline",V3.tok); t("headline: not ranked yet",r.d.me?.position===null,r.d.me);

// ================= TRACK & FIELD: LOWER IS BETTER =================
for(const [a,v] of [[T1,11.0],[T2,10.5]]) for(let i=0;i<3;i++) await manual(a,"sprint100",v,true);
for(const a of [T1,T2]) verifyAll(a);
r=await j("GET","/api/rankings?sport=Track%20%26%20Field&metric="+encodeURIComponent("100m Sprint (s)"),T1.tok);
const trows=r.d.rows.filter(x=>[T1.id,T2.id].includes(x.athleteId));
t("100m: the faster athlete (10.5 s) is #1, 11.0 s is #2",trows.length===2&&trows[0].athleteId===T2.id&&trows[0].value===10.5&&trows[1].athleteId===T1.id&&trows[1].value===11,trows);
t("positions follow the order for times",trows[0].position<trows[1].position,trows.map(x=>x.position));
r=await j("GET","/api/rankings?sport=Track%20%26%20Field&metric="+encodeURIComponent("100m Sprint (s)")+"&municipality=Tubod",T1.tok); t("location filter works for track too",r.d.rows.some(x=>x.athleteId===T1.id));

// ================= DIRECTORY SHOWS EACH SPORT'S RESULTS =================
const coach=await j("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:"Cora",lastName:LAST,email:`cora${ts}@t.ph`,organization:"Test U",position:"Head coach",sport:"Basketball"});
sql(`INSERT INTO user_roles (user_id, role_id, granted_at) SELECT '${coach.d.user.id}', id, now() FROM roles WHERE name='verified_coach'`);
const ct=(await j("POST","/api/auth/login",null,{identifier:`cora${ts}@t.ph`,password:pw.password,remember:false})).d.token;
r=await j("GET",`/api/recruiting/athletes?q=${LAST}&sport=Volleyball`,ct); const v1=r.d.items.find(x=>x.firstName==="Vol1");
t("volleyball athlete shows Spiking + Serving in the directory",v1&&v1.skills.some(s=>s.name==="Spiking"&&s.value==="80%")&&v1.skills.some(s=>s.name==="Serving"&&s.value==="60%"),v1?.skills);
t("volleyball score = average of the percentage skills it has (verified or not: it counts what the server counted)",v1.performanceScore>0&&v1.rank>0,{score:v1.performanceScore,rank:v1.rank});
r=await j("GET",`/api/recruiting/athletes?q=${LAST}&sport=Track%20%26%20Field`,ct); const tr2=r.d.items.find(x=>x.firstName==="Trk2");
t("track athlete shows the time with its unit (10.5 s), no % score",tr2&&tr2.skills[0].name==="100m Sprint"&&tr2.skills[0].value==="10.5 s"&&tr2.performanceScore===0,tr2);
t("track athlete is ranked",tr2.rank>0,tr2.rank);
console.log(`\n${pass} passed, ${fail} failed`);
