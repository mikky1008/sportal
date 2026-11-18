// The administrator's password and the server's startup sync. THROWAWAY local Postgres only.
// Runs the real provisioning code against the database ("a server restart") and uses the running API
// at http://localhost:8799 (started with ADMIN_EMAIL=admin@sportal.test ADMIN_PASSWORD=Adm1n-Secret-Pass).
// Rule under test: a password the administrator chose in Settings survives restarts; it is replaced by
// ADMIN_PASSWORD only when ADMIN_PASSWORD itself has been changed.
process.env.DATABASE_URL ??= "postgres://postgres@127.0.0.1:5544/sportal";
import { execSync } from "node:child_process";
const { provisionAdminAccount } = await import("../server/admin-account.server.ts");
const { closeDb } = await import("../server/db.server.ts");

const BASE="http://localhost:8799";
const ENV={ADMIN_EMAIL:"admin@sportal.test",ADMIN_PASSWORD:"Adm1n-Secret-Pass",ADMIN_USERNAME:"sportaladmin"};
const call=async(m,p,t,b)=>{const r=await fetch(BASE+p,{method:m,headers:{...(t?{authorization:"Bearer "+t}:{}),...(b!==undefined?{"content-type":"application/json"}:{})},body:b!==undefined?JSON.stringify(b):undefined});return {s:r.status,d:await r.json().catch(()=>null)}};
const sql=(q)=>execSync(`su postgres -c "psql -h /tmp -p 5544 -d sportal -tA -c \\"${q}\\""`).toString().trim();
let pass=0,fail=0; const t=(n,c,x)=>{c?(pass++,console.log("PASS",n)):(fail++,console.log("FAIL",n,JSON.stringify(x)?.slice(0,300)))};
const login=(pw)=>call("POST","/api/admin/auth/login",null,{identifier:"admin@sportal.test",password:pw});
const adminId=sql("SELECT id FROM users WHERE email='admin@sportal.test'");
const IN_APP="Chosen-In-Settings-42", ENV2="Operator-Reset-Pw-77";
sql("DELETE FROM login_attempts");

t("the account's environment password is tracked in the database",+sql(`SELECT count(*) FROM admin_account_state WHERE user_id='${adminId}'`)===1);
t("what is stored for it is a hash, not the password",!sql(`SELECT env_password_hash FROM admin_account_state WHERE user_id='${adminId}'`).includes(ENV.ADMIN_PASSWORD)&&sql(`SELECT env_password_hash FROM admin_account_state WHERE user_id='${adminId}'`).startsWith("scrypt$"));

// ---- 1. a restart with an unchanged environment leaves the administrator's own password alone
let tok=(await login(ENV.ADMIN_PASSWORD)).d.token;
t("the administrator signs in with the configured password",!!tok);
let r=await call("POST","/api/admin/settings/password",tok,{currentPassword:ENV.ADMIN_PASSWORD,newPassword:IN_APP});
t("the administrator chooses their own password in Settings",r.s===200,r.d);
let res=await provisionAdminAccount(undefined,ENV);
t("a restart with the SAME environment does not reset it",res.state==="ready"&&res.passwordChanged===false&&res.created===false,res);
t("...so the password chosen in Settings still works",(await login(IN_APP)).d.ok===true);
t("...and the environment password does not (it was replaced)",(await login(ENV.ADMIN_PASSWORD)).d.ok===false);
tok=(await login(IN_APP)).d.token;
res=await provisionAdminAccount(undefined,ENV);
res=await provisionAdminAccount(undefined,ENV);
t("restarting again and again changes nothing, and the session survives",res.passwordChanged===false&&(await call("GET","/api/auth/me",tok)).s===200);

// ---- 2. changing ADMIN_PASSWORD is how the person running the server takes the account back
const keep=(await login(IN_APP)).d.token;
res=await provisionAdminAccount(undefined,{...ENV,ADMIN_PASSWORD:ENV2});
t("a CHANGED environment password resets the account",res.state==="ready"&&res.passwordChanged===true,res);
t("...the new environment password works",(await login(ENV2)).d.ok===true);
t("...the password from Settings no longer works",(await login(IN_APP)).d.ok===false);
t("...and every old session is signed out",(await call("GET","/api/auth/me",keep)).s===401);
res=await provisionAdminAccount(undefined,{...ENV,ADMIN_PASSWORD:ENV2});
t("restarting with that same environment is again a no-op",res.passwordChanged===false);
t("the reset is in the audit log",+sql("SELECT count(*) FROM audit_log WHERE event='admin.password_rotated'")>=1);

// ---- 3. an invalid environment never touches the account
res=await provisionAdminAccount(undefined,{...ENV,ADMIN_PASSWORD:"short1"});
t("a weak ADMIN_PASSWORD is refused and nothing changes",res.state==="disabled"&&(await login(ENV2)).d.ok===true);
res=await provisionAdminAccount(undefined,{});
t("no environment at all changes nothing",res.state==="disabled"&&(await login(ENV2)).d.ok===true);

// ---- put back the configured password for the other suites
res=await provisionAdminAccount(undefined,ENV);
t("the configured password is restored",res.passwordChanged===true&&(await login(ENV.ADMIN_PASSWORD)).d.ok===true,res);
t("the display name and profile were never touched by the sync",sql(`SELECT display_name FROM users WHERE id='${adminId}'`)==="Sportal Administrator");
sql("DELETE FROM login_attempts");
await closeDb();
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
