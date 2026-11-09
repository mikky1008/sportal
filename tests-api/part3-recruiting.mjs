// Run against a THROWAWAY local Postgres only (it creates users and edits roles by SQL). Needs psql access as the postgres user; edit the sql() helper for your setup. API at http://localhost:8799.
import { execSync } from "node:child_process";
const B="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(B+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
sql("DELETE FROM signup_attempts"); // the sign-up limiter would otherwise stop a test run that creates many accounts
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const LAST="Rec"+ts;
const athlete=async(first,sport,school,pos)=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`});
  await j("PUT","/api/athletes/me/profile",r.d.token,{firstName:first,lastName:LAST,sport,position:pos,school,municipality:"Tubod",year:"Grade 12",heightCm:"180",weightKg:"70",teamStatus:"Varsity",teamName:"Eagles",bio:`Bio of ${first} ${ts}`,achievements:[{title:"MVP",year:"2025"}]});
  return {id:r.d.user.id,tok:r.d.token};
};
const coach=async(first,verified)=>{
  const r=await j("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:first,lastName:LAST,email:`${first.toLowerCase()}${ts}@t.ph`,organization:"Test U",position:"Head coach",sport:"Basketball"});
  if(verified) sql(`INSERT INTO user_roles (user_id, role_id, granted_at) SELECT '${r.d.user.id}', id, now() FROM roles WHERE name='verified_coach'`);
  const l=await j("POST","/api/auth/login",null,{identifier:`${first.toLowerCase()}${ts}@t.ph`,password:pw.password,remember:false});
  return {id:r.d.user.id,tok:l.d.token};
};
const sess=(tok,skill,result,cons)=>j("POST","/api/athletes/me/sessions",tok,{skill,result,consistency:cons,source:"ai"});

const Ana=await athlete("Ana","Basketball","School One","Guard");
const Ben=await athlete("Ben","Basketball","School Two","Forward");
const Hana=await athlete("Hana","Basketball","School One","Guard");
const Vic=await athlete("Vic","Volleyball","School Two","Setter");
const Zed=(await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:"Zed",lastName:LAST,email:`zed${ts}@t.ph`})).d; // never filled a profile
for(const r of [80,90,85]) await sess(Ana.tok,"shooting",r,90);
await sess(Ana.tok,"vertical",74,50);
for(let i=0;i<3;i++) await sess(Ben.tok,"shooting",70,60);
for(let i=0;i<3;i++) await sess(Hana.tok,"shooting",99,99);
sql(`UPDATE practice_sessions SET status='coach_verified', verified_at=now() WHERE id=(SELECT id FROM practice_sessions WHERE athlete_id='${Ana.id}' AND skill='shooting' LIMIT 1)`);
await j("PUT","/api/athletes/me/visibility",Hana.tok,{visible:false});
const Cora=await coach("Cora",true), Cleo=await coach("Cleo",true), Uma=await coach("Uma",false);
const rep=await j("POST","/api/auth/register",null,{...pw,accountType:"university_representative",firstName:"Rex",lastName:LAST,email:`rex${ts}@t.ph`,university:"Rep Univ",designation:"Director"});

const dir=(tok,qs="")=>j("GET",`/api/recruiting/athletes?q=${LAST}${qs}`,tok);
// ---- who may look ----
t("anon 401",(await j("GET","/api/recruiting/athletes")).s===401);
t("athlete cannot browse (403)",(await dir(Ana.tok)).s===403);
let r=await dir(Uma.tok); t("unverified coach blocked (coach_not_verified)",r.s===403&&r.d.code==="coach_not_verified",r);
t("university rep blocked",(await dir(rep.d.token)).s===403);
// ---- directory ----
r=await dir(Cora.tok);
const names=r.d.items.map(x=>x.firstName);
t("directory lists Ana, Ben, Vic",["Ana","Ben","Vic"].every(n=>names.includes(n)),names);
t("hidden Hana and profile-less Zed are absent",!names.includes("Hana")&&!names.includes("Zed"),names);
const ana=r.d.items.find(x=>x.firstName==="Ana");
t("Ana: score 85 (vertical excluded), 4 counted sessions, 1 coach-verified",ana.performanceScore===85&&ana.totalSessions===4&&ana.verifiedSessions===1,ana);
t("Ana: skills sorted (Shooting 85%, Vertical Jump 74 cm)",ana.skills[0].name==="Shooting"&&ana.skills[0].value==="85%"&&ana.skills[1].name==="Vertical Jump"&&ana.skills[1].value==="74 cm",ana.skills);
t("Ana: profile fields come through",ana.school==="School One"&&ana.position==="Guard"&&ana.municipality==="Tubod"&&ana.province==="Surigao del Norte"&&ana.teamName==="Eagles"&&ana.achievements[0].title==="MVP"&&/180 cm/.test(ana.height),ana);
t("Ana is ranked (rank > 0)",ana.rank>0,ana.rank);
const vic=r.d.items.find(x=>x.firstName==="Vic"); t("Volleyball athlete: no results yet, unranked",vic.totalSessions===0&&vic.performanceScore===0&&vic.rank===0,vic);
t("no emails in the directory",!JSON.stringify(r.d).includes("@t.ph"));
t("sorted by score by default (Ana before Ben)",names.indexOf("Ana")<names.indexOf("Ben"),names);
t("options present",r.d.options.sports.includes("Basketball")&&r.d.options.schools.includes("School Two")&&r.d.options.positions.includes("Guard"),r.d.options);
r=await dir(Cora.tok,"&sport=Volleyball"); t("sport filter",r.d.items.length===1&&r.d.items[0].firstName==="Vic",r.d.items.map(x=>x.firstName));
r=await dir(Cora.tok,"&verifiedOnly=true"); t("verifiedOnly → Ana only",r.d.items.length===1&&r.d.items[0].firstName==="Ana",r.d.items.map(x=>x.firstName));
r=await dir(Cora.tok,"&school=School%20Two"); t("school filter",r.d.items.map(x=>x.firstName).sort().join()==="Ben,Vic",r.d.items.map(x=>x.firstName));
r=await dir(Cora.tok,"&skill=Vertical%20Jump&sport=Basketball"); t("skill filter",r.d.items.length===1&&r.d.items[0].firstName==="Ana",r.d.items.map(x=>x.firstName));
r=await j("GET",`/api/recruiting/athletes?q=Bio%20of%20Ben%20${ts}`,Cora.tok); t("text search matches bio",r.d.items.length===1&&r.d.items[0].firstName==="Ben",r.d.items.map(x=>x.firstName));
r=await dir(Cora.tok,"&sort=name"); t("sort=name",r.d.items.map(x=>x.firstName).join()==="Ana,Ben,Vic",r.d.items.map(x=>x.firstName));
r=await dir(Cora.tok,"&limit=1&offset=1"); t("limit/offset with total",r.d.items.length===1&&r.d.total===3,{n:r.d.items.length,total:r.d.total});
// ---- detail ----
r=await j("GET",`/api/recruiting/athletes/${Ana.id}`,Cora.tok); t("detail",r.s===200&&r.d.athlete.firstName==="Ana"&&r.d.own===false&&r.d.watched===false&&r.d.inquiry===null,r.d);
t("hidden athlete detail → 404",(await j("GET",`/api/recruiting/athletes/${Hana.id}`,Cora.tok)).s===404);
t("profile-less athlete detail → 404",(await j("GET",`/api/recruiting/athletes/${Zed.user.id}`,Cora.tok)).s===404);
t("bad id → 404",(await j("GET",`/api/recruiting/athletes/nope`,Cora.tok)).s===404);
t("unverified coach detail blocked",(await j("GET",`/api/recruiting/athletes/${Ana.id}`,Uma.tok)).s===403);
t("other athlete cannot view someone else's showcase",(await j("GET",`/api/recruiting/athletes/${Ana.id}`,Ben.tok)).s===403);
r=await j("GET",`/api/recruiting/athletes/${Hana.id}`,Hana.tok); t("athlete sees OWN showcase even when hidden",r.s===200&&r.d.own===true&&r.d.athlete.visible===false,r.d);
// ---- watchlist + notes ----
r=await j("PUT",`/api/coach/shortlist/${Ana.id}`,Cora.tok); t("save Ana (existing shortlist route)",r.s===200);
await j("PUT",`/api/coach/shortlist/${Hana.id}`,Cora.tok);
r=await j("GET","/api/recruiting/watchlist",Cora.tok); t("watchlist shows Ana, not hidden Hana",r.d.items.length===1&&r.d.items[0].firstName==="Ana"&&r.d.items[0].note==="",r.d.items.map(x=>x.firstName));
r=await j("PUT",`/api/recruiting/watchlist/${Ana.id}/note`,Cora.tok,{note:"  Saw her at the camp  "}); t("note saved (trimmed)",r.s===200&&r.d.note==="Saw her at the camp",r);
r=await j("GET","/api/recruiting/watchlist",Cora.tok); t("note is returned",r.d.items[0].note==="Saw her at the camp");
r=await j("GET","/api/recruiting/watchlist",Cleo.tok); t("another coach has their own empty watchlist",r.d.items.length===0,r.d);
r=await j("GET",`/api/recruiting/athletes/${Ana.id}`,Cleo.tok); t("another coach does not see Cora's note",r.d.note===""&&r.d.watched===false,r.d);
r=await j("GET",`/api/recruiting/athletes/${Ana.id}`,Cora.tok); t("detail shows watched + note",r.d.watched===true&&r.d.note==="Saw her at the camp",r.d);
t("note too long → 400",(await j("PUT",`/api/recruiting/watchlist/${Ana.id}/note`,Cora.tok,{note:"x".repeat(501)})).s===400);
r=await j("PUT",`/api/recruiting/watchlist/${Ben.id}/note`,Cora.tok,{note:"hi"}); t("note on unsaved athlete → 409 not_saved",r.s===409&&r.d.code==="not_saved",r);
r=await dir(Cora.tok); t("directory lists the saved ids",r.d.watchlist.includes(Ana.id)&&!r.d.watchlist.includes(Ben.id),r.d.watchlist);
// ---- inquiries ----
const inq=(tok,b)=>j("POST","/api/recruiting/inquiries",tok,b);
t("unverified coach cannot inquire",(await inq(Uma.tok,{athleteId:Ana.id,organization:"Org",message:"hi"})).s===403);
t("athlete cannot inquire",(await inq(Ben.tok,{athleteId:Ana.id,organization:"Org",message:"hi"})).s===403);
r=await inq(Cora.tok,{athleteId:Hana.id,organization:"FEU",message:"hi"}); t("hidden athlete → 409 showcase_hidden",r.s===409&&r.d.code==="showcase_hidden",r);
t("unknown athlete → 404",(await inq(Cora.tok,{athleteId:"11111111-1111-4111-8111-111111111111",organization:"FEU",message:"hi"})).s===404);
t("a coach id is not an athlete → 404",(await inq(Cora.tok,{athleteId:Cleo.id,organization:"FEU",message:"hi"})).s===404);
t("empty message → 400",(await inq(Cora.tok,{athleteId:Ana.id,organization:"FEU",message:"   "})).s===400);
t("org too short → 400",(await inq(Cora.tok,{athleteId:Ana.id,organization:"x",message:"hi"})).s===400);
t("message too long → 400",(await inq(Cora.tok,{athleteId:Ana.id,organization:"FEU",message:"x".repeat(1001)})).s===400);
r=await inq(Cora.tok,{athleteId:Ana.id,organization:"  FEU Tamaraws  ",message:"  Join our program  "});
const iq=r.d?.inquiry; t("inquiry sent: Pending, trimmed",r.s===201&&iq.status==="Pending"&&iq.organization==="FEU Tamaraws"&&iq.message==="Join our program"&&iq.athleteId===Ana.id&&iq.unread===0,r);
t("duplicate open inquiry → 409",(await inq(Cora.tok,{athleteId:Ana.id,organization:"FEU",message:"again"})).d?.code==="already_open");
r=await j("GET","/api/notifications?category=recruitment",Ana.tok); t("athlete notified of inquiry",r.d.items.some(n=>n.title==="New recruitment inquiry"&&/Cora/.test(n.message)),r.d);
r=await j("GET",`/api/recruiting/athletes/${Ana.id}`,Cora.tok); t("detail shows the Pending inquiry",r.d.inquiry?.id===iq.id&&r.d.inquiry.status==="Pending",r.d.inquiry);
r=await j("GET","/api/recruiting/inquiries",Cora.tok); t("coach sees sent inquiries",r.d.items.length===1&&r.d.items[0].athleteName.startsWith("Ana"),r.d);
r=await j("GET","/api/recruiting/inquiries",Ana.tok); t("athlete sees received inquiries",r.d.items.length===1&&r.d.items[0].recruiterName.startsWith("Cora"),r.d);
r=await j("GET","/api/recruiting/inquiries",Ben.tok); t("other athlete sees none",r.d.items.length===0);
t("university rep has no inquiries",(await j("GET","/api/recruiting/inquiries",rep.d.token)).s===403);
// controlled messaging
const msg=(tok,id,body)=>j("POST",`/api/recruiting/inquiries/${id}/messages`,tok,{body});
r=await msg(Cora.tok,iq.id,"hello"); t("coach cannot message before accept (409 not_accepted)",r.s===409&&r.d.code==="not_accepted",r);
r=await msg(Ana.tok,iq.id,"hello"); t("athlete cannot message before accept either",r.s===409&&r.d.code==="not_accepted",r);
t("third party cannot read the thread (404)",(await j("GET",`/api/recruiting/inquiries/${iq.id}/messages`,Ben.tok)).s===404);
t("third party cannot respond (404)",(await j("POST",`/api/recruiting/inquiries/${iq.id}/respond`,Ben.tok,{decision:"accepted"})).s===404);
t("the coach cannot answer their own inquiry (403)",(await j("POST",`/api/recruiting/inquiries/${iq.id}/respond`,Cora.tok,{decision:"accepted"})).s===403);
t("bad decision → 400",(await j("POST",`/api/recruiting/inquiries/${iq.id}/respond`,Ana.tok,{decision:"maybe"})).s===400);
r=await j("POST",`/api/recruiting/inquiries/${iq.id}/respond`,Ana.tok,{decision:"accepted"}); t("athlete accepts",r.s===200&&r.d.inquiry.status==="Accepted",r);
t("answering twice → 409 already_answered",(await j("POST",`/api/recruiting/inquiries/${iq.id}/respond`,Ana.tok,{decision:"declined"})).d?.code==="already_answered");
r=await j("GET","/api/notifications?category=recruitment",Cora.tok); t("coach notified of acceptance",r.d.items.some(n=>n.title==="Inquiry accepted"),r.d);
r=await msg(Cora.tok,iq.id,"  Welcome aboard  "); t("coach can message after accept (from recruiter, trimmed)",r.s===201&&r.d.message.from==="recruiter"&&r.d.message.body==="Welcome aboard",r);
t("empty message → 400",(await msg(Cora.tok,iq.id,"   ")).s===400);
t("too-long message → 400",(await msg(Cora.tok,iq.id,"x".repeat(2001))).s===400);
t("third party cannot post (404)",(await msg(Ben.tok,iq.id,"hi")).s===404);
r=await j("GET","/api/recruiting/inquiries",Ana.tok); t("athlete has 1 unread message",r.d.items[0].unread===1,r.d.items[0]);
r=await j("GET",`/api/recruiting/inquiries/${iq.id}/messages`,Ana.tok); t("athlete reads thread (from recruiter)",r.d.items.length===1&&r.d.items[0].from==="recruiter",r.d);
r=await j("GET","/api/recruiting/inquiries",Ana.tok); t("reading marks it read",r.d.items[0].unread===0,r.d.items[0]);
r=await msg(Ana.tok,iq.id,"Thank you coach"); t("athlete replies (from athlete)",r.s===201&&r.d.message.from==="athlete",r);
r=await j("GET","/api/recruiting/inquiries",Cora.tok); t("coach has 1 unread",r.d.items[0].unread===1,r.d.items[0]);
r=await j("GET",`/api/recruiting/inquiries/${iq.id}/messages`,Cora.tok); t("thread has both messages in order",r.d.items.map(m=>m.from).join()==="recruiter,athlete",r.d);
r=await j("GET","/api/notifications?category=recruitment",Ana.tok); t("athlete notified of the message",r.d.items.some(n=>n.title==="New message"&&/Welcome aboard/.test(n.message)),r.d);
r=await j("GET","/api/coach/dashboard",Cora.tok); t("existing coach dashboard still works with the new data",r.s===200,r.s);
// decline path + re-inquiry
r=await inq(Cleo.tok,{athleteId:Ben.id,organization:"UST",message:"Hello Ben"}); const iq2=r.d.inquiry;
r=await j("POST",`/api/recruiting/inquiries/${iq2.id}/respond`,Ben.tok,{decision:"declined"}); t("athlete declines",r.d.inquiry.status==="Declined",r);
t("declined → messaging stays closed",(await msg(Cleo.tok,iq2.id,"hi")).d?.code==="not_accepted");
r=await inq(Cleo.tok,{athleteId:Ben.id,organization:"UST",message:"Second try"}); t("after a decline the coach may send a new inquiry",r.s===201,r);
// hiding after accepting
await j("PUT","/api/athletes/me/visibility",Ana.tok,{visible:false});
r=await dir(Cora.tok); t("hidden Ana leaves the directory",!r.d.items.some(x=>x.firstName==="Ana"));
t("hidden Ana detail → 404",(await j("GET",`/api/recruiting/athletes/${Ana.id}`,Cora.tok)).s===404);
r=await msg(Cora.tok,iq.id,"Still there?"); t("existing conversation stays open after hiding",r.s===201,r);
r=await j("GET","/api/recruiting/inquiries",Cora.tok); t("inquiry list still shows her",r.d.items.some(i=>i.athleteId===Ana.id&&i.status==="Accepted"));
r=await j("GET","/api/recruiting/watchlist",Cora.tok); t("watchlist drops hidden Ana",r.d.items.length===0,r.d.items.map(x=>x.firstName));
await j("PUT","/api/athletes/me/visibility",Ana.tok,{visible:true});
r=await dir(Cora.tok); t("visible again → back in the directory",r.d.items.some(x=>x.firstName==="Ana"));
console.log(`\n${pass} passed, ${fail} failed`);
