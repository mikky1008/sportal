// Platform Monitoring: reported content, moderation, activity logs. THROWAWAY local Postgres only; API at http://localhost:8799
// started with ADMIN_EMAIL=admin@sportal.test ADMIN_PASSWORD=Adm1n-Secret-Pass.
import { execSync } from "node:child_process";
import { adminToken, approvedRep } from "./_rep.mjs";
const BASE="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});const text=await r.text();let d=null;try{d=JSON.parse(text)}catch{};return {s:r.status,d,text}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)?.slice(0,300)))};
sql("DELETE FROM signup_attempts"); sql("DELETE FROM login_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const reg=(type,n,extra={})=>j("POST","/api/auth/register",null,{...pw,accountType:type,firstName:n,lastName:"Mon"+ts,email:`${n.toLowerCase()}${ts}@mon.ph`,...extra});
const adm=await adminToken(j);
const ATH=async(n)=>{const r=await reg("student_athlete",n);return {id:r.d.user.id,tok:r.d.token,name:`${n} Mon${ts}`}};
const setBio=(id,bio)=>sql(`INSERT INTO athlete_profiles (user_id,sport,playing_position,school,bio,created_at,updated_at) VALUES ('${id}','Basketball','Guard','Mon School','${bio}',now(),now()) ON CONFLICT (user_id) DO UPDATE SET bio=EXCLUDED.bio`);
const setExtras=(id)=>sql(`INSERT INTO athlete_extras (user_id,universities,coverage,course,photo_data,photo_status,video_url,video_status,updated_at) VALUES ('${id}','{}','','','data:image/png;base64,iVBORw0KGgo=','approved','https://example.com/highlight-${ts}','approved',now()) ON CONFLICT (user_id) DO UPDATE SET photo_data=EXCLUDED.photo_data,photo_status='approved',video_url=EXCLUDED.video_url,video_status='approved'`);

// ---------- people
const T1=await ATH("Tara"), T2=await ATH("Nova"), T3=await ATH("Suri"), T4=await ATH("Dane"), A2=await ATH("Rhea");
const C=await reg("coach","Cole",{organization:"Mon Org",position:"Head coach",sport:"Basketball"});
const R=await approvedRep(j,{...pw,accountType:"university_representative",firstName:"Reed",lastName:"Mon"+ts,email:`reed${ts}@mon.ph`,university:"Mon University "+ts,designation:"Director"});
setBio(T1.id,"Original bio of Tara"); setExtras(T1.id); setBio(T3.id,"Bio of Suri"); setBio(T4.id,"Bio of Dane"); setBio(T2.id,"Plain bio");
const post=(tok,b)=>j("POST","/api/reports",tok,b);
const rep=(tok,id,type="athlete_profile",reason="inappropriate",extra={})=>post(tok,{athleteId:id,contentType:type,reason,...extra});

// ---------- filing a report
t("anonymous cannot file (401)",(await post(null,{athleteId:T1.id,contentType:"athlete_profile",reason:"spam"})).s===401);
t("the administrator cannot file (403)",(await rep(adm,T1.id)).s===403);
let r=await rep(C.d.token,T1.id,"nonsense"); t("unknown content type is refused (400)",r.s===400&&!!r.d.fieldErrors?.contentType,r.d);
r=await rep(C.d.token,T1.id,"video","because"); t("unknown reason is refused (400)",r.s===400&&!!r.d.fieldErrors?.reason,r.d);
r=await rep(C.d.token,T1.id,"athlete_profile","spam",{details:"x".repeat(501)}); t("details over 500 characters refused (400)",r.s===400,r.d);
t("you cannot report yourself (400)",(await rep(T1.tok,T1.id)).s===400);
t("an unknown athlete is a 404",(await rep(C.d.token,"nope")).s===404);
t("a coach is not reportable (404)",(await rep(T1.tok,C.d.user.id)).s===404);
const adminId=sql("SELECT id FROM users WHERE email='admin@sportal.test'");
t("the administrator is not reportable (404)",(await rep(C.d.token,adminId)).s===404);
t("reporting a video that doesn't exist is a 409",(await rep(C.d.token,T2.id,"video")).s===409);
t("reporting a photo that doesn't exist is a 409",(await rep(C.d.token,T2.id,"photo")).s===409);
const rProfile=await rep(C.d.token,T1.id,"athlete_profile","inappropriate",{details:"Offensive wording in the bio"});
t("a coach can report an athlete's profile",rProfile.s===200&&rProfile.d.report.status==="pending",rProfile.d);
t("the reported bio is kept as evidence",sql(`SELECT snapshot FROM content_reports WHERE id='${rProfile.d.report.id}'`)==="Original bio of Tara");
t("the same open report twice is refused (409)",(await rep(C.d.token,T1.id,"athlete_profile","spam")).s===409);
const rVideo=await rep(C.d.token,T1.id,"video","inappropriate");
const rPhoto=await rep(R.d.token,T1.id,"photo","impersonation");
const rBioA2=await rep(A2.tok,T1.id,"athlete_profile","harassment");
t("a representative, an athlete and a coach can each file; video/photo/profile all work",rVideo.s===200&&rPhoto.s===200&&rBioA2.s===200,[rVideo.d,rPhoto.d,rBioA2.d]);
t("a video report keeps the link as evidence",sql(`SELECT snapshot FROM content_reports WHERE id='${rVideo.d.report.id}'`)===`https://example.com/highlight-${ts}`);
const rSusp=await rep(C.d.token,T3.id,"athlete_profile","harassment");
const rDismiss=await rep(C.d.token,T4.id,"athlete_profile","false_information");
const rInv=await rep(A2.tok,T4.id,"athlete_profile","spam");
t("all remaining reports filed",rSusp.s===200&&rDismiss.s===200&&rInv.s===200);
// daily limit: 10 open reports (5 athletes x 2 kinds) then the 11th is refused
const spammer=await reg("coach","Spam",{organization:"Org",position:"Head coach",sport:"Basketball"});
[T1,T2,T3,T4,A2].forEach((a,i)=>["athlete_profile","video"].forEach((k,x)=>sql(`INSERT INTO content_reports (id,reporter_id,target_user_id,content_type,reason,status,created_at) VALUES ('lim${ts}${i}${x}','${spammer.d.user.id}','${a.id}','${k}','spam','pending',now())`)));
r=await rep(spammer.d.token,T2.id,"athlete_profile","spam"); t("more than 10 reports in a day is refused (429)",r.s===429,r);
t("filing wrote an audit event",+sql(`SELECT count(*) FROM audit_log WHERE event='report.submitted' AND detail LIKE '%${rProfile.d.report.id}%'`)===1);

// ---------- access control
for(const [who,tok] of [["anonymous",null],["a student",T2.tok],["a coach",C.d.token],["a representative",R.d.token]]){
  const want=tok?403:401;
  for(const [name,m,p,b] of [["overview","GET","/api/admin/monitoring/overview"],["activity","GET","/api/admin/monitoring/activity"],["report list","GET","/api/admin/reports"],["report detail","GET",`/api/admin/reports/${rProfile.d.report.id}`],["investigate","POST",`/api/admin/reports/${rProfile.d.report.id}/investigate`,{}],["dismiss","POST",`/api/admin/reports/${rProfile.d.report.id}/dismiss`,{}],["resolve","POST",`/api/admin/reports/${rProfile.d.report.id}/resolve`,{actions:["warn_user"],message:"hey"}]])
    t(`${who}: ${name} is ${want}`,(await j(m,p,tok,b)).s===want);
}
t("the report is still pending after those attempts",sql(`SELECT status FROM content_reports WHERE id='${rProfile.d.report.id}'`)==="pending");

// ---------- the queue
r=await j("GET","/api/admin/reports?limit=100",adm);
const mine=r.d.items.filter(i=>[rProfile,rVideo,rPhoto,rBioA2,rSusp,rDismiss,rInv].some(x=>x.d.report.id===i.id));
t("admin sees all seven reports",r.s===200&&mine.length===7,mine.length);
const first=mine.find(i=>i.id===rProfile.d.report.id);
t("each row has type, reason, status, date, reporter and the reported athlete",first&&first.contentType==="athlete_profile"&&first.reason==="inappropriate"&&first.status==="pending"&&!isNaN(Date.parse(first.createdAt))&&first.reporter.name==="Cole Mon"+ts&&first.target.name===T1.name&&first.target.suspended===false,first);
t("counts per status are returned",["pending","investigating","resolved","dismissed"].every(k=>Number.isInteger(r.d.counts[k])),r.d.counts);
t("type filter",(await j("GET","/api/admin/reports?type=video&limit=100",adm)).d.items.every(i=>i.contentType==="video"));
t("status filter",(await j("GET","/api/admin/reports?status=pending&limit=100",adm)).d.items.every(i=>i.status==="pending"));
t("bad status or type are 400",(await j("GET","/api/admin/reports?status=x",adm)).s===400&&(await j("GET","/api/admin/reports?type=x",adm)).s===400);
t("oldest open report comes first",(()=>{const d=r.d.items.filter(i=>i.status==="pending").map(i=>Date.parse(i.createdAt));return d.every((v,i)=>i===0||d[i-1]<=v)})());

// ---------- the detail panel's evidence
r=await j("GET",`/api/admin/reports/${rVideo.d.report.id}`,adm);
t("video report shows the link and its status",r.d.report.content.kind==="video"&&r.d.report.content.url===`https://example.com/highlight-${ts}`&&r.d.report.content.status==="approved",r.d.report.content);
r=await j("GET",`/api/admin/reports/${rPhoto.d.report.id}`,adm);
t("photo report shows the image",r.d.report.content.kind==="photo"&&r.d.report.content.dataUrl?.startsWith("data:image/png;base64,"));
r=await j("GET",`/api/admin/reports/${rProfile.d.report.id}`,adm);
t("profile report shows the bio, details, both emails and other reports about the same athlete",r.d.report.content.bio==="Original bio of Tara"&&r.d.report.details==="Offensive wording in the bio"&&r.d.report.reporterEmail===`cole${ts}@mon.ph`&&r.d.report.targetEmail===`tara${ts}@mon.ph`&&r.d.report.otherReports.total>=4,r.d.report);
t("unknown report -> 404",(await j("GET","/api/admin/reports/nope",adm)).s===404);

// ---------- moderation never touches roles or verification
const guard=()=>sql("SELECT (SELECT md5(string_agg(user_id||':'||role_id::text,',' ORDER BY user_id,role_id)) FROM user_roles)||(SELECT coalesce(md5(string_agg(coach_id||status,',' ORDER BY coach_id)),'') FROM coach_verifications)||(SELECT coalesce(md5(string_agg(user_id||status,',' ORDER BY user_id)),'') FROM rep_applications)");
const before=guard();

// ---------- investigate
r=await j("POST",`/api/admin/reports/${rInv.d.report.id}/investigate`,adm,{});
t("investigate moves it to 'investigating' and records who",r.d.ok&&r.d.report.status==="investigating"&&r.d.report.investigatedBy==="Sportal Administrator"&&!!r.d.report.investigatedAt,r.d);
t("investigating again is harmless",(await j("POST",`/api/admin/reports/${rInv.d.report.id}/investigate`,adm,{})).d.report.status==="investigating");

// ---------- dismiss
r=await j("POST",`/api/admin/reports/${rDismiss.d.report.id}/dismiss`,adm,{note:"Bio is fine."});
t("dismiss closes it with a note",r.d.ok&&r.d.report.status==="dismissed"&&r.d.report.resolutionNote==="Bio is fine."&&!!r.d.report.resolvedAt&&r.d.report.actions.length===0,r.d);
t("dismissing changes nothing about the content",sql(`SELECT bio FROM athlete_profiles WHERE user_id='${T4.id}'`)==="Bio of Dane");
t("a closed report can't be dismissed again (409)",(await j("POST",`/api/admin/reports/${rDismiss.d.report.id}/dismiss`,adm,{})).s===409);
t("a closed report can't be investigated (409)",(await j("POST",`/api/admin/reports/${rDismiss.d.report.id}/investigate`,adm,{})).s===409);
t("an over-long note is refused (400)",(await j("POST",`/api/admin/reports/${rInv.d.report.id}/dismiss`,adm,{note:"x".repeat(501)})).s===400);

// ---------- resolve: validation
const res=(id,b)=>j("POST",`/api/admin/reports/${id}/resolve`,adm,b);
t("resolve needs an action (400)",(await res(rVideo.d.report.id,{actions:[]})).s===400&&(await res(rVideo.d.report.id,{})).s===400);
t("an unknown action is refused (400)",(await res(rVideo.d.report.id,{actions:["delete_everything"]})).s===400);
r=await res(rVideo.d.report.id,{actions:["warn_user"]}); t("warning needs a message (400)",r.s===400&&!!r.d.fieldErrors?.message,r.d);
t("nothing changed by the refused attempts",sql(`SELECT status FROM content_reports WHERE id='${rVideo.d.report.id}'`)==="pending");

// ---------- resolve: remove content + warn (video)
r=await res(rVideo.d.report.id,{actions:["remove_content","warn_user"],message:"Please keep your highlight video appropriate.",note:"Removed after review."});
t("resolve: video removed and athlete warned",r.d.ok&&r.d.report.status==="resolved"&&r.d.report.actions.join()==="remove_content,warn_user"&&r.d.effects.includes("Athlete warned"),r.d);
t("the video is marked rejected (link kept as evidence)",sql(`SELECT video_status||'|'||video_url FROM athlete_extras WHERE user_id='${T1.id}'`)===`rejected|https://example.com/highlight-${ts}`);
t("the athlete received the warning as a notification",sql(`SELECT category||'|'||message FROM notifications WHERE user_id='${T1.id}' AND title LIKE 'A report about%'`)==="system|Please keep your highlight video appropriate.");
// photo
r=await res(rPhoto.d.report.id,{actions:["remove_content"]});
t("resolve: photo marked rejected",r.d.ok&&sql(`SELECT photo_status FROM athlete_extras WHERE user_id='${T1.id}'`)==="rejected");
// profile bio
r=await res(rProfile.d.report.id,{actions:["remove_content"],note:"Offensive."});
t("resolve: biography cleared",r.d.ok&&sql(`SELECT bio FROM athlete_profiles WHERE user_id='${T1.id}'`)==="");
r=await j("GET",`/api/admin/reports/${rProfile.d.report.id}`,adm);
t("...but the evidence of what it said is still on the report",r.d.report.snapshot==="Original bio of Tara"&&r.d.report.content.bio==="");
t("resolving a closed report again is 409",(await res(rProfile.d.report.id,{actions:["warn_user"],message:"again"})).s===409);
// suspend
t("before: the reported athlete can use the app",(await j("GET","/api/auth/me",T3.tok)).s===200);
r=await res(rSusp.d.report.id,{actions:["suspend_account"],note:"Harassment confirmed."});
t("resolve: account suspended",r.d.ok&&r.d.effects.includes("Account suspended")&&sql(`SELECT is_active FROM users WHERE id='${T3.id}'`)==="f",r.d);
t("...and signed out everywhere at once",(await j("GET","/api/auth/me",T3.tok)).s===401);
t("...and cannot sign in",(await j("POST","/api/auth/login",null,{identifier:`suri${ts}@mon.ph`,password:pw.password,remember:false})).d.code==="inactive");
t("User Management shows why",(await j("GET",`/api/admin/users/${T3.id}`,adm)).d.user.history.some(h=>h.event==="suspended"&&/Moderation/.test(h.reason??"")));
// resolve an investigating report; and already-suspended is not an error
r=await res(rInv.d.report.id,{actions:["suspend_account","warn_user"],message:"Final warning."});
t("an investigating report can be resolved, with several actions",r.d.ok&&r.d.report.status==="resolved"&&r.d.report.actions.length===2,r.d);
t("roles and verification records were not touched by any of it",guard()===before);

// ---------- overview
r=await j("GET","/api/admin/monitoring/overview",adm); const ov=r.d.overview;
const n=(q)=>+sql(q);
t("overview: pending/investigating/resolved/dismissed equal the table",ov.reports.pending===n("SELECT count(*) FROM content_reports WHERE status='pending'")&&ov.reports.investigating===n("SELECT count(*) FROM content_reports WHERE status='investigating'")&&ov.reports.resolved===n("SELECT count(*) FROM content_reports WHERE status='resolved'")&&ov.reports.dismissed===n("SELECT count(*) FROM content_reports WHERE status='dismissed'"),ov.reports);
t("overview: flagged content = distinct reported items with an open report",ov.flaggedContent===n("SELECT count(*) FROM (SELECT DISTINCT target_user_id,content_type FROM content_reports WHERE status IN ('pending','investigating')) x"),ov.flaggedContent);
const IMPORTANT="'login.success','admin.login.success','login.failed','login.blocked','admin.login.failed','admin.login.blocked','admin.provisioned','admin.password_rotated','admin.role_revoked','user.created','coach_verification.requested','coach_verification.approved','coach_verification.rejected','admin.user_suspended','admin.user_reactivated','admin.rep_approved','admin.rep_rejected','connection.requested','connection.accepted','connection.declined','connection.cancelled','connection.disconnected','recruiting.inquiry_sent','coach_application.sent','scholarship.created','scholarship.applied','scholarship.withdrawn','scholarship.application_status','practice_session.verified','report.submitted','report.investigating','report.dismissed','report.resolved'";
t("overview: total activities equals the important events in the audit log",ov.activities.total===n(`SELECT count(*) FROM audit_log WHERE event IN (${IMPORTANT})`)&&ov.activities.last24h>0&&ov.activities.last24h<=ov.activities.total,ov.activities);
t("the dashboard's bell count of pending reports matches",(await j("GET","/api/admin/overview",adm)).d.overview.pendingReports===ov.reports.pending);

// ---------- activity logs
await j("POST","/api/auth/login",null,{identifier:"MyS3cretPassw0rd!!",password:"x",remember:false});
await j("POST","/api/auth/login",null,{identifier:`ghost${ts}@nowhere.ph`,password:"x",remember:false});
r=await j("GET","/api/admin/monitoring/activity?limit=50",adm);
t("activity items have time, user name and description",r.s===200&&r.d.items.length>0&&r.d.items.every(i=>!isNaN(Date.parse(i.at))&&i.user.name&&i.description&&i.category),r.d.items[0]);
t("newest first",r.d.items.every((it,i)=>i===0||Date.parse(r.d.items[i-1].at)>=Date.parse(it.at)));
t("total matches the overview",r.d.total===n(`SELECT count(*) FROM audit_log WHERE event IN (${IMPORTANT})`));
const all=(await j("GET","/api/admin/monitoring/activity?limit=50&category=moderation",adm)).d;
t("moderation filter shows only report events",all.items.length>0&&all.items.every(i=>i.category==="moderation"));
const text=(await j("GET","/api/admin/monitoring/activity?limit=50&category=moderation",adm)).d.items.map(i=>i.description);
t("a filed report reads as a sentence naming who was reported",text.some(d=>d===`Reported ${T1.name}'s profile for inappropriate content`),text.slice(0,4));
t("a resolution names the athlete and what was done",text.some(d=>d===`Resolved a report about ${T3.name}: suspended the account`),text.slice(0,6));
t("a moderation step is attributed to the administrator",all.items.some(i=>i.user.name==="Sportal Administrator"&&/Dismissed a report about/.test(i.description)));
const adm2=(await j("GET","/api/admin/monitoring/activity?limit=50&category=administration",adm)).d.items.map(i=>i.description);
t("a suspension reads 'suspended by <the administrator>' with its reason",adm2.some(d=>/^Account suspended by Sportal Administrator \(Moderation: report/.test(d)),adm2.slice(0,3));
const reg2=(await j("GET","/api/admin/monitoring/activity?limit=50&category=accounts",adm)).d.items;
t("sign-ups read 'Created a <role> account'",reg2.some(i=>i.user.name===T1.name&&i.description==="Created a student-athlete account"));
t("search by user name",(await j("GET",`/api/admin/monitoring/activity?limit=50&q=${encodeURIComponent("Tara Mon"+ts)}`,adm)).d.items.every(i=>i.user.name===T1.name)&&(await j("GET",`/api/admin/monitoring/activity?q=${encodeURIComponent("Tara Mon"+ts)}`,adm)).d.total>=2);
t("LIKE wildcards in search are literal",(await j("GET","/api/admin/monitoring/activity?q=%25",adm)).d.total===0);
t("a bad category is 400",(await j("GET","/api/admin/monitoring/activity?category=nope",adm)).s===400);
const pg1=(await j("GET","/api/admin/monitoring/activity?limit=3&offset=0",adm)).d, pg2=(await j("GET","/api/admin/monitoring/activity?limit=3&offset=3",adm)).d;
t("pagination moves through the log",pg1.items.length===3&&pg2.items.length===3&&pg1.items[0].id!==pg2.items[0].id);
const failed=(await j("GET","/api/admin/monitoring/activity?limit=10&category=security",adm)).d.items;
t("a failed sign-in with an email is shown by that email",failed.some(i=>i.user.name===`ghost${ts}@nowhere.ph`));
t("a failed sign-in whose name isn't an email (maybe a pasted password) is never shown",!JSON.stringify(failed).includes("MyS3cretPassw0rd")&&failed.some(i=>i.user.name==="Unknown account"));
const everything=JSON.stringify((await j("GET","/api/admin/monitoring/activity?limit=50",adm)).d);
t("no password hashes or tokens in the log output",!everything.includes("scrypt$")&&!everything.includes(adm));
t("events that aren't important (sign-outs, searches) are left out",!(await j("GET","/api/admin/monitoring/activity?limit=50",adm)).d.items.some(i=>/^(logout|athlete\.searched)$/.test(i.description)));

// ---------- database rules
const bad=(q)=>{try{execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -v ON_ERROR_STOP=1 -c \\"${q}\\"" 2>&1`);return false}catch{return true}};
t("the database refuses an unknown content type",bad(`INSERT INTO content_reports (id,target_user_id,content_type,reason,created_at) VALUES ('bad1','${T1.id}','banner','spam',now())`));
t("the database refuses a closed report with no close time",bad(`INSERT INTO content_reports (id,target_user_id,content_type,reason,status,created_at) VALUES ('bad2','${T1.id}','video','spam','resolved',now())`));
t("the database refuses an action that isn't a moderation action",bad(`INSERT INTO content_reports (id,target_user_id,content_type,reason,actions,created_at) VALUES ('bad3','${T1.id}','video','spam','{make_admin}',now())`));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
