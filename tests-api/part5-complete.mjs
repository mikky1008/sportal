// Run against a THROWAWAY local Postgres only (it creates users and edits roles by SQL). Needs psql access as the postgres user; edit the sql() helper for your setup. API at http://localhost:8799.
import { execSync } from "node:child_process";
const B="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(B+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
await j("POST","/api/auth/login",null,{identifier:"warmup",password:"x"}); // makes sure the migrations have run
sql("DELETE FROM signup_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const LAST="Srch"+ts;
const athlete=async(first,sport,profile=true)=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`});
  if(profile) await j("PUT","/api/athletes/me/profile",r.d.token,{firstName:first,lastName:LAST,sport,position:"",school:"School "+first,municipality:"Tubod",year:"",heightCm:"",weightKg:"",teamStatus:"",teamName:"",bio:"",achievements:[]});
  return {id:r.d.user.id,tok:r.d.token};
};
const coach=async(first,verified)=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`,organization:"Test U",position:"Head coach",sport:"Basketball"});
  if(verified) sql(`INSERT INTO user_roles (user_id, role_id, granted_at) SELECT '${r.d.user.id}', id, now() FROM roles WHERE name='verified_coach'`);
  const l=await j("POST","/api/auth/login",null,{identifier:`${first.toLowerCase()}${ts}@t.ph`,password:pw.password,remember:false});
  return {id:r.d.user.id,tok:l.d.token};
};
const rep=async(first,uni)=>{const r=await j("POST","/api/auth/register",null,{...pw,accountType:"university_representative",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`,university:uni,designation:"Director"});return {id:r.d.user.id,tok:r.d.token};};
const connect=async(c,a)=>{const r=await j("POST","/api/connections/requests",c.tok,{userId:a.id});const id=r.d?.connection?.id;const acc=await j("POST",`/api/connections/requests/${id}/accept`,a.tok);return acc.s===200;};
const manual=(a,skill,result,ask=true)=>j("POST","/api/athletes/me/sessions",a.tok,{skill,result,source:"manual",consistency:null,...(ask?{requestedReview:true}:{})});
const notes=async(a,cat)=>(await j("GET",`/api/notifications?category=${cat}`,a.tok)).d.items;

const Cora=await coach("Cora",true), Cleo=await coach("Cleo",true), Uma=await coach("Uma",false);

// =================== 1. COACH REVIEW QUEUE (the real path, no SQL) ===================
const Vol=await athlete("Vol","Volleyball");
t("coach connects to the volleyball athlete",await connect(Cora,Vol));
const made=[]; for(let i=0;i<3;i++) made.push((await manual(Vol,"spiking",80,true)).d.session);
t("hand-entered results wait as Pending Review",made.every(m=>m.status==="Pending Review"),made);
const selfRep=(await manual(Vol,"spiking",95,false)).d.session;
t("a result with no review request is Self-Reported",selfRep.status==="Self-Reported",selfRep);
const spike=(tok)=>j("GET","/api/rankings?sport=Volleyball&metric=Spike%20Accuracy",tok);
let r=await spike(Vol.tok); t("before verification: not ranked, 0 counted",r.d.me?.row===null&&r.d.me.counted===0,r.d.me);
r=await j("GET","/api/coach/sessions",Cora.tok); const q=r.d.items.filter(i=>i.athlete.id===Vol.id);
t("the connected coach sees all 3 in the review queue",q.length===3&&q.every(i=>i.skill==="spiking"&&i.result===80),r.d);
t("the self-reported result is not in the queue",!r.d.items.some(i=>i.id===selfRep.id));
t("queue names the athlete (no emails)",q[0].athlete.displayName.startsWith("Vol")&&!JSON.stringify(r.d).includes("@t.ph"));
t("a coach who is NOT connected sees none of them",!(await j("GET","/api/coach/sessions",Cleo.tok)).d.items.some(i=>i.athlete.id===Vol.id));
t("an unverified coach cannot use the queue (403)",(await j("GET","/api/coach/sessions",Uma.tok)).s===403);
t("an athlete cannot use the queue (403)",(await j("GET","/api/coach/sessions",Vol.tok)).s===403);
t("an unconnected coach cannot verify (4xx)",(await j("POST",`/api/coach/sessions/${q[0].id}/verify`,Cleo.tok)).s>=400);
t("an athlete cannot verify their own result (403)",(await j("POST",`/api/coach/sessions/${q[0].id}/verify`,Vol.tok)).s===403);
for(const i of q){ r=await j("POST",`/api/coach/sessions/${i.id}/verify`,Cora.tok); if(r.s!==200) console.log("verify failed",r.s,JSON.stringify(r.d)); }
r=await j("POST",`/api/coach/sessions/${q[0].id}/verify`,Cora.tok); t("verifying twice → 409",r.s===409,r);
t("the queue is empty afterwards",!(await j("GET","/api/coach/sessions",Cora.tok)).d.items.some(i=>i.athlete.id===Vol.id));
r=await spike(Vol.tok); t("after verification the athlete is ranked on those 3 (value 80)",r.d.me?.row?.value===80&&r.d.me.counted===3&&r.d.me.row.verifiedSessions===3,r.d.me);
t("the self-reported 95 never counted",r.d.me.row.value===80);
const n=await notes(Vol,"verification"); t("athlete notified for each verified result",n.filter(x=>x.title==="Result verified").length===3&&/Spiking/.test(n[0].message),n);

// =================== 2. FOOTBALL ===================
const Fb=await athlete("Fbl","Football"); const Bk=await athlete("Bkt","Basketball");
t("football athlete connects",await connect(Cora,Fb));
r=await manual(Bk,"fbkicking",70); t("a basketball athlete cannot log a football skill",r.s>=400&&r.s<500,r);
r=await manual(Fb,"spiking",70); t("a football athlete cannot log a volleyball skill",r.s>=400&&r.s<500,r);
r=await manual(Fb,"fbpassing",101); t("football result above 100 rejected",r.s>=400&&r.s<500,r);
const fbs=[]; for(const v of [70,70,70]) fbs.push((await manual(Fb,"fbpassing",v,true)).d.session);
for(const s of fbs) await j("POST",`/api/coach/sessions/${s.id}/verify`,Cora.tok);
r=await j("GET","/api/rankings?sport=Football",Fb.tok); t("football has its own rankings (default metric Passing Accuracy)",r.s===200&&r.d.metric==="Passing Accuracy"&&r.d.me?.row?.value===70,r.d.me);
r=await j("GET","/api/rankings?sport=Football&metric=Kick%20Accuracy",Fb.tok); t("football second metric works (Kick Accuracy, not ranked yet)",r.s===200&&r.d.me?.row===null,r.d.me);
r=await j("GET","/api/rankings/headline",Fb.tok); t("football headline rank = Passing Accuracy",r.d.me?.metric==="Passing Accuracy"&&r.d.me.position>=1,r.d.me);
r=await j("GET",`/api/recruiting/athletes?q=${LAST}&sport=Football`,Cora.tok); const fbd=r.d.items.find(x=>x.firstName==="Fbl");
t("directory shows the football skill and score",fbd&&fbd.skills[0].name==="Passing"&&fbd.skills[0].value==="70%"&&fbd.performanceScore===70&&fbd.rank>0,fbd);

// =================== 3. HEADER SEARCH ===================
const Ana=await athlete("Ana","Basketball"), Hid=await athlete("Hid","Basketball"), HidC=await athlete("Hidc","Basketball"), Non=await athlete("Non","Basketball",false), Req=await athlete("Req","Basketball");
await j("PUT","/api/athletes/me/visibility",Hid.tok,{visible:false});
t("hidden-but-connected athlete is connected",await connect(Cora,HidC));
await j("PUT","/api/athletes/me/visibility",HidC.tok,{visible:false});
await j("POST","/api/connections/requests",Req.tok,{userId:Cora.id}); // an athlete asking the coach to connect
const srch=(tok,qs=LAST)=>j("GET",`/api/search?q=${encodeURIComponent(qs)}&limit=10`,tok);
r=await srch(Cora.tok); const byName=Object.fromEntries(r.d.athletes.map(a=>[a.firstName,a]));
t("coach finds athletes who are NOT on My Athletes (Ana, Non, Req)",["Ana","Non","Req"].every(n=>byName[n]),Object.keys(byName));
t("coach also finds athletes already in My Athletes",byName.Vol&&byName.Fbl&&byName.Hidc,Object.keys(byName));
t("relationship: connected / none / request_received",byName.Vol.relationship==="connected"&&byName.Ana.relationship==="none"&&byName.Req.relationship==="request_received",[byName.Vol,byName.Ana,byName.Req].map(a=>a.relationship));
t("hidden athlete who is NOT connected stays out",!byName.Hid,Object.keys(byName));
t("hidden athlete who IS connected is found, but has no showcase page",byName.Hidc&&byName.Hidc.hasShowcase===false&&byName.Hidc.relationship==="connected",byName.Hidc);
t("athlete with no profile yet: found, no showcase",byName.Non&&byName.Non.hasShowcase===false&&byName.Non.relationship==="none",byName.Non);
t("visible athletes with a profile have a showcase page",byName.Ana.hasShowcase===true&&byName.Vol.hasShowcase===true,[byName.Ana.hasShowcase,byName.Vol.hasShowcase]);
t("connected athletes are listed first",r.d.athletes.slice(0,3).every(a=>a.relationship==="connected"),r.d.athletes.map(a=>a.relationship));
t("school and sport come through; no emails",byName.Ana.sport==="Basketball"&&byName.Ana.school==="School Ana"&&!JSON.stringify(r.d).includes("@t.ph"));
t("the showcase link target really opens for a found athlete",(await j("GET",`/api/recruiting/athletes/${byName.Ana.id}`,Cora.tok)).s===200);
r=await j("POST","/api/connections/requests",Cora.tok,{userId:Ana.id}); t("Connect button: request sent",r.s===201,r);
r=await srch(Cora.tok); t("search now shows request_sent for Ana",r.d.athletes.find(a=>a.firstName==="Ana").relationship==="request_sent");
r=await srch(Cora.tok,"Ana "+LAST); t("multi-word name search",r.d.athletes.length===1&&r.d.athletes[0].firstName==="Ana",r.d.athletes.map(a=>a.firstName));
t("unverified coach gets no athletes",(await srch(Uma.tok)).d.athletes.length===0);
t("an athlete gets no athletes",(await srch(Ana.tok)).d.athletes.length===0);
t("one-letter search returns nothing",(await srch(Cora.tok,"A")).d.athletes.length===0);

// =================== 4. SCHOLARSHIP APPLICATIONS REVIEWED BY THE UNIVERSITY ===================
const Rex=await rep("Rex","Rex University"), Rio=await rep("Rio","Rio University");
const sch=(await j("POST","/api/scholarships",Rex.tok,{name:"Rex Grant",sport:"Basketball",coverage:"Full",details:"",eligibility:[],deadline:"2099-01-01"})).d.scholarship;
const sch2=(await j("POST","/api/scholarships",Rio.tok,{name:"Rio Grant",sport:"Basketball",coverage:"Full",details:"",eligibility:[],deadline:"2099-01-01"})).d.scholarship;
const App=await athlete("Appl","Basketball"), AppH=await athlete("Apph","Basketball"), Never=await athlete("Never","Basketball");
await j("PUT","/api/athletes/me/visibility",AppH.tok,{visible:false});
await j("POST",`/api/scholarships/${sch.id}/apply`,App.tok); await j("POST",`/api/scholarships/${sch.id}/apply`,AppH.tok);
t("anonymous cannot list applicants",(await j("GET",`/api/scholarships/${sch.id}/applications`)).s===401);
r=await j("GET",`/api/scholarships/${sch.id}/applications`,Rex.tok); const apps=r.d.items;
t("the poster sees both applicants (name, sport, school, status New)",apps.length===2&&apps.every(a=>a.status==="submitted")&&apps.some(a=>a.athlete.displayName.startsWith("Appl")&&a.athlete.school==="School Appl"),r.d);
t("no emails in the applicant list",!JSON.stringify(r.d).includes("@t.ph"));
t("another university cannot list them (404)",(await j("GET",`/api/scholarships/${sch.id}/applications`,Rio.tok)).s===404);
t("an athlete cannot list applicants (404)",(await j("GET",`/api/scholarships/${sch.id}/applications`,App.tok)).s===404);
const aApp=apps.find(a=>a.athlete.id===App.id), aAppH=apps.find(a=>a.athlete.id===AppH.id);
const setS=(tok,id,status)=>j("POST",`/api/scholarships/applications/${id}/status`,tok,{status});
t("an invalid status → 400",(await setS(Rex.tok,aApp.id,"maybe")).s===400);
t("an unknown application → 404",(await setS(Rex.tok,"nope","accepted")).s===404);
t("another university cannot change it (404)",(await setS(Rio.tok,aApp.id,"accepted")).s===404);
t("an athlete cannot change it (404)",(await setS(App.tok,aApp.id,"accepted")).s===404);
r=await setS(Rex.tok,aApp.id,"under_review"); t("poster marks it under review",r.s===200&&r.d.status==="under_review",r);
r=await j("GET","/api/scholarships",App.tok); t("the athlete sees the new status on the scholarship",r.d.items.find(i=>i.id===sch.id).myApplication.status==="under_review");
let sn=await notes(App,"scholarship"); t("athlete notified: under review",sn.some(x=>x.title==="Application update"&&/Rex Grant.*under review/.test(x.message)),sn);
const before=sn.length; await setS(Rex.tok,aApp.id,"under_review"); sn=await notes(App,"scholarship"); t("the same status again does not notify twice",sn.length===before,sn.length);
await setS(Rex.tok,aApp.id,"accepted"); sn=await notes(App,"scholarship"); t("athlete notified: accepted",sn.some(x=>/was accepted/.test(x.message)));
await setS(Rex.tok,aApp.id,"rejected"); sn=await notes(App,"scholarship"); t("athlete notified: not selected",sn.some(x=>/was not selected/.test(x.message)));
r=await j("GET","/api/athletes/me/applications",App.tok); t("athlete's own applications list shows rejected",r.d.items[0].status==="rejected",r.d.items[0]);
// who may open an applicant's showcase
r=await j("GET",`/api/recruiting/athletes/${App.id}`,Rex.tok); t("the university can open an applicant's showcase (applicant mode, no coach actions)",r.s===200&&r.d.applicant===true&&r.d.own===false&&r.d.watched===false&&r.d.inquiry===null,r.d);
r=await j("GET",`/api/recruiting/athletes/${AppH.id}`,Rex.tok); t("...even if the athlete hid their showcase (they chose to apply)",r.s===200&&r.d.applicant===true,r);
t("another university cannot open it (403)",(await j("GET",`/api/recruiting/athletes/${App.id}`,Rio.tok)).s===403);
t("a university cannot open someone who never applied (403)",(await j("GET",`/api/recruiting/athletes/${Never.id}`,Rex.tok)).s===403);
t("a university still cannot browse the directory (403)",(await j("GET","/api/recruiting/athletes",Rex.tok)).s===403);
t("a university cannot send inquiries (403)",(await j("POST","/api/recruiting/inquiries",Rex.tok,{athleteId:App.id,organization:"Rex U",message:"hi"})).s===403);
await j("POST",`/api/scholarships/${sch.id}/withdraw`,AppH.tok);
r=await j("GET",`/api/scholarships/${sch.id}/applications`,Rex.tok); t("withdrawn applicants are listed last",r.d.items[r.d.items.length-1].status==="withdrawn",r.d.items.map(i=>i.status));
r=await setS(Rex.tok,aAppH.id,"accepted"); t("a withdrawn application cannot be changed (409)",r.s===409&&r.d.code==="withdrawn",r);
t("after withdrawing, the university loses access to that showcase",(await j("GET",`/api/recruiting/athletes/${AppH.id}`,Rex.tok)).s===403);
r=await j("GET",`/api/scholarships/${sch2.id}/applications`,Rio.tok); t("a scholarship nobody applied to has an empty list",r.s===200&&r.d.items.length===0,r.d);

// =================== 5. UNIVERSITY REPRESENTATIVE LANDING ===================
const roles=await import(new URL("../src/lib/roles.ts",import.meta.url).href);
t("a university representative lands on /scholarships",roles.homePathFor(["university_representative"])==="/scholarships");
t("a coach still lands on the coach dashboard",roles.homePathFor(["coach"])==="/coach/dashboard");
t("an athlete still lands on the dashboard",roles.homePathFor(["student_athlete"])==="/dashboard");
console.log(`\n${pass} passed, ${fail} failed`);
