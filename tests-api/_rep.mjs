// Shared by the API suites. A school representative can no longer sign up and walk in: they apply with a
// document and an administrator approves them. `approvedRep` does the whole dance and returns the same
// shape the old Sign up response had ({ s, d: { ok, user, token } }), so the suites read the same.
// Needs the API started with ADMIN_EMAIL / ADMIN_PASSWORD (defaults below match the test setup).

export const sampleDoc = (name = "staff-id.pdf", kind = "staff_id") => ({
  kind, fileName: name, data: Buffer.from("%PDF-1.4\n% sportal test document\n%%EOF\n").toString("base64"),
});

export const adminToken = async (j) =>
  (await j("POST", "/api/admin/auth/login", null, {
    identifier: process.env.ADMIN_EMAIL || "admin@sportal.test",
    password: process.env.ADMIN_PASSWORD || "Adm1n-Secret-Pass",
  })).d?.token;

export async function approvedRep(j, body) {
  const password = body.password ?? "Passw0rd!long1";
  const reg = await j("POST", "/api/auth/register", null, { password, confirmPassword: password, documents: [sampleDoc()], ...body });
  if (!reg.d?.ok) return reg;
  const adm = await adminToken(j);
  const email = body.email.toLowerCase();
  const found = await j("GET", `/api/admin/users?q=${encodeURIComponent(email)}&limit=5`, adm);
  const id = found.d?.items?.find((u) => u.email === email)?.id;
  const approved = await j("POST", `/api/admin/school-verifications/${id}/approve`, adm, {});
  if (!approved.d?.ok) return { s: approved.s, d: approved.d };
  const login = await j("POST", "/api/auth/login", null, { identifier: email, password, remember: false });
  // Approval leaves a "your account is approved" notification; clear it so suites that count notifications see only their own.
  if (login.d?.token) await j("POST", "/api/notifications/read-all", login.d.token, {});
  return { s: login.s, d: { ...login.d, role: "university_representative" } };
}
