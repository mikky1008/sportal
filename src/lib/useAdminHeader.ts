import { useCallback, useEffect, useState } from "react";
import { fetchAdminHeader, onAdminHeaderChange, type AdminHeader } from "@/lib/adminApi";

/** The administrator's name, photo and bell counts for the top bar. Reloads when Settings changes any of them. */
export function useAdminHeader() {
  const [header, setHeader] = useState<AdminHeader | null>(null);
  const refresh = useCallback(() => {
    void fetchAdminHeader().then((r) => {
      if (r.ok) setHeader(r.data.header);
    });
  }, []);
  useEffect(() => {
    refresh();
    return onAdminHeaderChange(refresh);
  }, [refresh]);
  return { header, refresh };
}
