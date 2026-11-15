// Admin User Management (statuses: pending/rejected now come from school representative applications). Run against a THROWAWAY local Postgres only; API at http://localhost:8799 started with
// ADMIN_EMAIL=admin@sportal.test ADMIN_PASSWORD=Adm1n-Secret-Pass (see part8).
import { execSync } from "node:child_process";
import { approvedRep, sampleDoc } from "./_rep.mjs";
const BASE="http://localhost:8799";
const j=async(m,p,t,b)=>{const r=await fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b?{"content-type":"application/json"}:{})},body:b?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)))};
sql("DELETE FROM signup_attempts"); sql("DELETE FROM login_attempts");
const ts=Date.now(); const pw={password:"Passw0rd!long1",confirmPassword:"Passw0rd!long1"};
const reg=(type,extra)=>j("POST","/api/auth/register",null,{...pw,accountType:type,firstName:type.slice(0,4),lastName:"Zq"+ts,email:`${type}${ts}@um.ph`,...extra});

const S=await reg("student_athlete"); const C=await reg("coach",{organization:"Zephyr University "+ts,position:"Head coach",sport:"Basketball"});
const R=await approvedRep(j,{...pw,accountType:"university_representative",firstName:"univ",lastName:"Zq"+ts,email:`university_representative${ts}@um.ph`,university:"Zephyr University "+ts,designation:"Director"});
// a second representative whose application is still waiting
const W=await reg("university_representative",{university:"Zephyr University "+ts,designation:"Dean",documents:[sampleDoc()],firstName:"wait",email:`waiting${ts}@um.ph`});
t("test accounts created",S.d.ok&&C.d.ok&&R.d.ok&&W.d.ok&&W.d.pendingApproval,[S.d.ok,C.d.ok,R.d.ok,W.d]);
const adm=(await j("POST","/api/admin/auth/login",null,{identifier:"admin@sportal.test",password:"Adm1n-Secret-Pass"})).d.token;
const list=(qs="")=>j("GET","/api/admin/users"+qs,adm);

// ---- access control
t("anonymous cannot read the directory (401)",(await j("GET","/api/admin/users")).s===401);
for(const [who,tok] of [["student",S.d.token],["coach",C.d.token],["representative",R.d.token]]){
  t(`${who} cannot read the directory (403)`,(await j("GET","/api/admin/users",tok)).s===403);
  t(`${who} cannot suspend anyone (403)`,(await j("POST",`/api/admin/users/${S.d.user.id}/suspend`,tok,{})).s===403);
}
t("a student is still signed in after those attempts",(await j("GET","/api/auth/me",S.d.token)).s===200);

// ---- directory content
let r=await list(`?q=${ts}&limit=100`);
t("search by a shared term finds all four new users",r.d.ok&&r.d.total===4,r.d.total);
const byRole=(x)=>r.d.items.find(i=>i.role===x);
t("each user has name, email, role, registration date",r.d.items.every(i=>i.name&&i.email&&i.role&&!isNaN(Date.parse(i.registeredAt))),r.d.items);
t("coach shows their organization as school",byRole("coach")?.school===`Zephyr University ${ts}`);
t("representative shows their university as school",byRole("university_representative")?.school===`Zephyr University ${ts}`);
t("student with no school shows null",byRole("student_athlete")?.school===null);
t("coach and student are 'active' (coaches no longer have a pending state here)",byRole("coach")?.status==="active"&&byRole("student_athlete")?.status==="active",r.d.items.map(i=>i.status));
t("a representative waiting for approval is 'pending'",r.d.items.find(i=>i.email===`waiting${ts}@um.ph`)?.status==="pending",r.d.items.map(i=>i.email+":"+i.status));
t("the administrator never appears in the directory",!(await list("?q=sportal.test&limit=100")).d.items.some(i=>i.email==="admin@sportal.test"));
t("password hashes are never sent",!JSON.stringify(r.d).includes("scrypt$") && !JSON.stringify(r.d).includes("password"));
t("summary counts add up",r.d.summary.total===r.d.summary.active+r.d.summary.pending+r.d.summary.suspended+r.d.summary.rejected,r.d.summary);

// ---- filters
for(const role of ["student_athlete","coach","university_representative"]){
  const x=await list(`?q=${ts}&role=${role}`); t(`role filter ${role}`,x.d.total===(role==="university_representative"?2:1)&&x.d.items.every(i=>i.role===role),x.d);
}
t("search by email works",(await list(`?q=${encodeURIComponent(`coach${ts}@um.ph`)}`)).d.total===1);
t("search by school works",(await list(`?q=${encodeURIComponent("Zephyr University "+ts)}`)).d.total===3);
t("search is case-insensitive",(await list(`?q=ZEPHYR%20university%20${ts}`)).d.total===3);
t("LIKE wildcards in search are treated literally",(await list("?q=%25")).d.total===0 && (await list(`?q=Z_${ts}`)).d.total===0 && (await list(`?q=Zq${ts}`)).d.total===4);
t("bad role filter rejected (400)",(await list("?role=admin")).s===400);
t("bad status filter rejected (400)",(await list("?status=banned")).s===400);
t("SQL-looking search is harmless",(await list("?q="+encodeURIComponent("'; DROP TABLE users;--"))).d.ok===true && +sql("SELECT count(*) FROM users")>0);
const pg1=await list(`?q=${ts}&limit=2&offset=0`), pg2=await list(`?q=${ts}&limit=2&offset=2`);
t("pagination splits results",pg1.d.items.length===2&&pg2.d.items.length===2&&pg1.d.total===4);

// ---- detail
r=await j("GET",`/api/admin/users/${C.d.user.id}`,adm);
t("detail has username, roles, position, sport, history",r.d.ok&&r.d.user.username&&r.d.user.roles.includes("coach")&&r.d.user.position==="Head coach"&&r.d.user.sport==="Basketball"&&r.d.user.history.some(h=>h.event==="registered"),r.d);
t("unknown id -> 404",(await j("GET","/api/admin/users/nope",adm)).s===404);
const adminId=sql("SELECT id FROM users WHERE email='admin@sportal.test'");
t("the administrator's own record is not reachable here (404)",(await j("GET",`/api/admin/users/${adminId}`,adm)).s===404);

// ---- suspend / reactivate
t("reactivating an active account -> 409",(await j("POST",`/api/admin/users/${S.d.user.id}/reactivate`,adm,{})).s===409);
r=await j("POST",`/api/admin/users/${S.d.user.id}/suspend`,adm,{reason:"Spam posts"});
t("admin can suspend a student",r.d.ok&&r.d.user.status==="suspended",r.d);
t("suspended student's existing session is dead immediately",(await j("GET","/api/auth/me",S.d.token)).s===401);
r=await j("POST","/api/auth/login",null,{identifier:`student_athlete${ts}@um.ph`,password:pw.password,remember:false});
t("suspended student cannot sign in, and is told why",r.d.ok===false&&r.d.code==="inactive"&&/suspended/i.test(r.d.message),r.d);
t("suspended status appears in the directory and filter",(await list(`?q=${ts}&status=suspended`)).d.items.map(i=>i.id).join()===S.d.user.id);
t("suspending twice -> 409",(await j("POST",`/api/admin/users/${S.d.user.id}/suspend`,adm,{})).s===409);
t("detail history records the suspension with its reason",(await j("GET",`/api/admin/users/${S.d.user.id}`,adm)).d.user.history.some(h=>h.event==="suspended"&&h.reason==="Spam posts"));
t("over-long reason rejected (400)",(await j("POST",`/api/admin/users/${C.d.user.id}/suspend`,adm,{reason:"x".repeat(301)})).s===400);
r=await j("POST",`/api/admin/users/${S.d.user.id}/reactivate`,adm,{});
t("admin can reactivate",r.d.ok&&r.d.user.status==="active",r.d);
r=await j("POST","/api/auth/login",null,{identifier:`student_athlete${ts}@um.ph`,password:pw.password,remember:false});
t("reactivated student can sign in again",r.d.ok===true,r.d);
t("suspend and reactivate are in the audit log with the acting admin",+sql(`SELECT count(*) FROM audit_log WHERE user_id='${S.d.user.id}' AND event IN ('admin.user_suspended','admin.user_reactivated') AND detail LIKE '%${adminId}%'`)===2);

// ---- the admin cannot lock themselves out
t("admin cannot suspend themselves (400)",(await j("POST",`/api/admin/users/${adminId}/suspend`,adm,{})).s===400);
t("admin is still signed in",(await j("GET","/api/admin/overview",adm)).s===200);
// ---- other roles unaffected: coach & rep keep working while the student was suspended
t("coach session unaffected throughout",(await j("GET","/api/auth/me",C.d.token)).s===200 && (await j("GET","/api/auth/me",R.d.token)).s===200);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
