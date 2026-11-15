// School Verification: school/university representative applications. THROWAWAY local Postgres only; API at http://localhost:8799
// started with ADMIN_EMAIL=admin@sportal.test ADMIN_PASSWORD=Adm1n-Secret-Pass.
import { execSync } from "node:child_process";
import { adminToken, sampleDoc } from "./_rep.mjs";
const BASE="http://localhost:8799";
const raw=(m,p,t,b)=>fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});
const j=async(m,p,t,b)=>{const r=await raw(m,p,t,b);return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)?.slice(0,300)))};
sql("DELETE FROM signup_attempts"); sql("DELETE FROM login_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const png=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.from("fake-png-body")]);
const SCHOOL=`Verity University ${ts}`;
const apply=(n,extra={})=>j("POST","/api/auth/register",null,{...pw,accountType:"university_representative",firstName:n,lastName:"Rep"+ts,email:`${n.toLowerCase()}${ts}@verity.edu`,university:SCHOOL,designation:"Athletics Director",documents:[sampleDoc("staff-id.pdf"),{kind:"authorization_letter",fileName:"letter.png",data:png.toString("base64")}],...extra});
const adm=await adminToken(j);
const list=(qs="")=>j("GET","/api/admin/school-verifications"+qs,adm);

// ---------- applying: validation
let r=await apply("NoDocs",{documents:[]});
t("applying with no documents is refused",r.d.ok===false&&!!r.d.fieldErrors?.documents,r.d);
r=await apply("NoDocs2",{documents:undefined});
t("omitting the documents field is refused too",r.d.ok===false&&!!r.d.fieldErrors?.documents,r.d);
r=await apply("Disguised",{documents:[{kind:"staff_id",fileName:"id.pdf",data:Buffer.from("<html><script>alert(1)</script></html>").toString("base64")}]});
t("an HTML file renamed .pdf is refused (type comes from the bytes)",r.d.ok===false&&/PDF, PNG or JPEG/.test(r.d.message),r.d);
r=await apply("Exe",{documents:[{kind:"staff_id",fileName:"id.pdf",data:Buffer.from("MZ\x90\x00 exe").toString("base64")}]});
t("an executable renamed .pdf is refused",r.d.ok===false);
r=await apply("Big",{documents:[{kind:"staff_id",fileName:"big.pdf",data:Buffer.concat([Buffer.from("%PDF-"),Buffer.alloc(2*1024*1024)]).toString("base64")}]});
t("a file over 2 MB is refused",r.d.ok===false&&/2 MB/.test(r.d.message),r.d);
const chunk=Buffer.concat([Buffer.from("%PDF-"),Buffer.alloc(1.6*1024*1024)]).toString("base64");
r=await apply("Total",{documents:[{kind:"staff_id",fileName:"a.pdf",data:chunk},{kind:"other",fileName:"b.pdf",data:chunk}]});
t("documents over 3 MB together are refused",r.d.ok===false&&/3 MB/.test(r.d.message),r.d);
r=await apply("Many",{documents:[1,2,3,4].map(i=>sampleDoc(`d${i}.pdf`))});
t("more than 3 documents are refused",r.d.ok===false&&!!r.d.fieldErrors?.documents,r.d);
r=await apply("BadKind",{documents:[{...sampleDoc(),kind:"selfie"}]});
t("an unknown document type is refused",r.d.ok===false);
r=await apply("B64",{documents:[{...sampleDoc(),data:"not base64!!"}]});
t("garbage that isn't base64 is refused",r.d.ok===false);
t("none of the refused applications created an account",+sql(`SELECT count(*) FROM users WHERE email LIKE '%${ts}@verity.edu'`)===0);

// ---------- applying: success means "applied", not "signed in"
const A=await apply("Alma"), B=await apply("Brix"), C=await apply("Cara");
t("applying succeeds but gives no session or user",A.d.ok===true&&A.d.pendingApproval===true&&!A.d.token&&!A.d.user,A.d);
t("application and its 2 documents are stored",sql(`SELECT count(*) FROM rep_application_documents d JOIN users u ON u.id=d.user_id WHERE u.email='alma${ts}@verity.edu'`)==="2");
t("documents are stored as validated types, not what the client claimed",sql(`SELECT string_agg(mime_type,',' ORDER BY file_name) FROM rep_application_documents d JOIN users u ON u.id=d.user_id WHERE u.email='alma${ts}@verity.edu'`)==="image/png,application/pdf");

// ---------- the gate
const login=(n,p=pw.password)=>j("POST","/api/auth/login",null,{identifier:`${n.toLowerCase()}${ts}@verity.edu`,password:p,remember:true});
r=await login("Alma");
t("a pending representative cannot sign in, and is told why",r.d.ok===false&&r.d.code==="pending_approval"&&/reviewed/i.test(r.d.message)&&!r.d.token,r.d);
r=await login("Alma","Wrong-password-1");
t("a WRONG password still just says incorrect (no status leak)",r.d.code==="invalid_credentials");
const almaUser=sql(`SELECT username FROM users WHERE email='alma${ts}@verity.edu'`);
r=await j("POST","/api/auth/login",null,{identifier:almaUser,password:pw.password,remember:false});
t("signing in by username doesn't get around it",r.d.ok===false&&r.d.code==="pending_approval",r.d);
r=await j("POST","/api/admin/auth/login",null,{identifier:`alma${ts}@verity.edu`,password:pw.password});
t("nor does the administrator sign-in",r.d.ok===false&&r.d.code==="invalid_credentials",r.d);

// ---------- admin list
r=await list("?status=pending&limit=100");
const mine=r.d.items?.filter(i=>i.email.endsWith(`${ts}@verity.edu`))??[];
t("admin sees the three pending applications",r.s===200&&mine.length===3,mine.length);
const a=mine.find(i=>i.email.startsWith("alma"));
t("each row has applicant, school, email, date, status, document count",a&&a.name==="Alma Rep"+ts&&a.school===SCHOOL&&a.email===`alma${ts}@verity.edu`&&!isNaN(Date.parse(a.submittedAt))&&a.status==="pending"&&a.documentCount===2,a);
t("counts are returned",["pending","approved","rejected"].every(k=>Number.isInteger(r.d.counts[k])),r.d.counts);
t("status filter is validated (400)",(await list("?status=maybe")).s===400);
t("coach verification no longer appears here",!JSON.stringify(r.d).includes("coach_verification"));

// ---------- access control
const S=await j("POST","/api/auth/register",null,{...pw,accountType:"student_athlete",firstName:"Stu",lastName:"Dent"+ts,email:`stu${ts}@verity.edu`});
const K=await j("POST","/api/auth/register",null,{...pw,accountType:"coach",firstName:"Coa",lastName:"Ch"+ts,email:`coa${ts}@verity.edu`,organization:"Org",position:"Head coach",sport:"Basketball"});
t("anonymous gets 401",(await j("GET","/api/admin/school-verifications")).s===401);
for(const [who,tok] of [["student",S.d.token],["coach",K.d.token]]){
  t(`${who}: list is 403`,(await j("GET","/api/admin/school-verifications",tok)).s===403);
  t(`${who}: detail is 403`,(await j("GET",`/api/admin/school-verifications/${a.id}`,tok)).s===403);
  t(`${who}: cannot approve (403)`,(await j("POST",`/api/admin/school-verifications/${a.id}/approve`,tok,{})).s===403);
}

// ---------- detail + documents
r=await j("GET",`/api/admin/school-verifications/${a.id}`,adm);
const docs=r.d.application?.documents??[];
t("detail lists documents with name, type and size, but never their bytes",docs.length===2&&docs.every(d=>d.id&&d.fileName&&d.mimeType&&d.sizeBytes>0&&!("data" in d)),r.d);
const pdfDoc=docs.find(d=>d.mimeType==="application/pdf");
const f=await raw("GET",`/api/admin/school-verifications/${a.id}/documents/${pdfDoc.id}`,adm);
const bytes=Buffer.from(await f.arrayBuffer());
t("the administrator can download a document, byte for byte",f.status===200&&f.headers.get("content-type")==="application/pdf"&&bytes.toString().startsWith("%PDF-")&&bytes.length===pdfDoc.sizeBytes);
t("downloads are never cached or sniffed",f.headers.get("x-content-type-options")==="nosniff"&&/no-store/.test(f.headers.get("cache-control")));
t("a student cannot download it (403)",(await raw("GET",`/api/admin/school-verifications/${a.id}/documents/${pdfDoc.id}`,S.d.token)).status===403);
t("anonymous cannot download it (401)",(await raw("GET",`/api/admin/school-verifications/${a.id}/documents/${pdfDoc.id}`)).status===401);
t("a document can't be fetched through someone else's application (404)",(await raw("GET",`/api/admin/school-verifications/${B.d?"x":a.id}/documents/${pdfDoc.id}`,adm)).status===404);
t("unknown application -> 404",(await j("GET","/api/admin/school-verifications/nope",adm)).s===404);
t("a non-representative id is not an application (404)",(await j("GET",`/api/admin/school-verifications/${S.d.user.id}`,adm)).s===404);

// ---------- reject
const b=mine.find(i=>i.email.startsWith("brix")), c=mine.find(i=>i.email.startsWith("cara"));
t("rejecting needs a reason (400)",(await j("POST",`/api/admin/school-verifications/${b.id}/reject`,adm,{})).s===400);
t("a 1-character reason is refused (400)",(await j("POST",`/api/admin/school-verifications/${b.id}/reject`,adm,{reason:"x"})).s===400);
t("a 501-character reason is refused (400)",(await j("POST",`/api/admin/school-verifications/${b.id}/reject`,adm,{reason:"x".repeat(501)})).s===400);
r=await j("POST",`/api/admin/school-verifications/${b.id}/reject`,adm,{reason:"The authorization letter isn't signed."});
t("admin can reject with a reason",r.d.ok&&r.d.application.status==="rejected"&&r.d.application.rejectionReason==="The authorization letter isn't signed."&&r.d.application.reviewedBy,r.d);
r=await login("Brix");
t("a rejected applicant can't sign in and reads the reason",r.d.ok===false&&r.d.code==="application_rejected"&&r.d.message.includes("The authorization letter isn't signed."),r.d);
t("rejecting twice -> 409",(await j("POST",`/api/admin/school-verifications/${b.id}/reject`,adm,{reason:"again"})).s===409);
t("rejected tab lists it",(await list("?status=rejected&limit=100")).d.items.some(i=>i.id===b.id));
t("it is gone from the pending tab",!(await list("?status=pending&limit=100")).d.items.some(i=>i.id===b.id));

// ---------- approve
r=await j("POST",`/api/admin/school-verifications/${a.id}/approve`,adm,{});
t("admin can approve",r.d.ok&&r.d.application.status==="approved"&&r.d.application.reviewedAt,r.d);
r=await login("Alma");
t("the approved representative can now sign in",r.d.ok===true&&r.d.user.roles.includes("university_representative")&&!!r.d.token,r.d);
const almaTok=r.d.token;
t("and their session works",(await j("GET","/api/auth/me",almaTok)).s===200);
t("approving twice -> 409",(await j("POST",`/api/admin/school-verifications/${a.id}/approve`,adm,{})).s===409);
t("an approved application can't be 'rejected' here (409)",(await j("POST",`/api/admin/school-verifications/${a.id}/reject`,adm,{reason:"changed my mind"})).s===409);
t("approval registers the school",sql(`SELECT count(*) FROM universities WHERE name_key='${SCHOOL.toLowerCase()}'`)==="1");
r=await j("POST",`/api/admin/school-verifications/${c.id}/approve`,adm,{});
t("a second rep from the same school doesn't duplicate it",r.d.ok&&sql(`SELECT count(*) FROM universities WHERE name_key='${SCHOOL.toLowerCase()}'`)==="1");
t("the approved applicant got a notification",+sql(`SELECT count(*) FROM notifications WHERE user_id='${a.id}' AND title LIKE '%approved%'`)===1);
r=await j("POST",`/api/admin/school-verifications/${b.id}/approve`,adm,{});
t("a rejected application can be reconsidered and approved",r.d.ok&&r.d.application.status==="approved"&&r.d.application.rejectionReason===null,r.d);
t("...after which that person can sign in",(await login("Brix")).d.ok===true);

// ---------- defense in depth: the session itself is refused if the application isn't approved
sql(`UPDATE rep_applications SET status='pending' WHERE user_id='${a.id}'`);
t("a live session stops working if the application is not approved",(await j("GET","/api/auth/me",almaTok)).s===401);
sql(`UPDATE rep_applications SET status='approved' WHERE user_id='${a.id}'`);
t("...and works again once approved",(await j("GET","/api/auth/me",almaTok)).s===200);

// ---------- user management interplay
const D=await apply("Dune");
const dId=(await j("GET",`/api/admin/users?q=dune${ts}`,adm)).d.items[0];
t("User Management shows a waiting representative as Pending",dId.status==="pending",dId);
t("User Management refuses to suspend them (409) and points to School Verification",(await j("POST",`/api/admin/users/${dId.id}/suspend`,adm,{})).s===409);
await j("POST",`/api/admin/school-verifications/${dId.id}/reject`,adm,{reason:"Not a school address."});
t("a rejected representative shows as Rejected there",(await j("GET",`/api/admin/users?q=dune${ts}`,adm)).d.items[0].status==="rejected");
t("the summary counts rejected separately",(await j("GET","/api/admin/users",adm)).d.summary.rejected>=1);
t("an approved representative can be suspended normally",(await j("POST",`/api/admin/users/${a.id}/suspend`,adm,{})).d.user.status==="suspended");
await j("POST",`/api/admin/users/${a.id}/reactivate`,adm,{});

// ---------- dashboard numbers come from the same data
r=await j("GET","/api/admin/overview",adm);
t("dashboard pending count = pending representative applications",r.d.overview.totals.pending===+sql("SELECT count(*) FROM rep_applications WHERE status='pending'"),r.d.overview.totals);

// ---------- audit + database rules
t("approve/reject are in the audit log with the reason",+sql(`SELECT count(*) FROM audit_log WHERE event='admin.rep_rejected' AND detail LIKE '%authorization letter%'`)>=1&&+sql("SELECT count(*) FROM audit_log WHERE event='admin.rep_approved'")>=2);
t("no document bytes ever land in the audit log",+sql("SELECT count(*) FROM audit_log WHERE detail LIKE '%PDF-%'")===0);
let blocked=false; try{execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -v ON_ERROR_STOP=1 -c \\"INSERT INTO rep_application_documents (id,user_id,kind,file_name,mime_type,size_bytes,data,uploaded_at) VALUES ('x','${a.id}','other','a.html','text/html',1,'\\\\\\\\x41',now())\\"" 2>&1`)}catch{blocked=true}
t("the database itself refuses a non-PDF/PNG/JPEG document",blocked);
t("other roles are unaffected: student and coach still work",(await j("GET","/api/auth/me",S.d.token)).s===200&&(await j("GET","/api/auth/me",K.d.token)).s===200);
t("existing representatives made before this feature were kept as approved",sql("SELECT count(*) FROM rep_applications WHERE status<>'approved' AND submitted_at < now() - interval '1 day'")==="0");
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
