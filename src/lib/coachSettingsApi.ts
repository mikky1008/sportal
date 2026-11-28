import { apiRequest } from "@/auth/authClient";

export const changeCoachPassword = (b: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
  apiRequest<{ otherSessionsSignedOut: number }>("/api/coach/settings/password", { method: "POST", body: b });
