import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export function useAuth(allowedRoles: string[]) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session) {
      router.push("/login"); // Redirect to login if not authenticated
    } else if (!allowedRoles.includes(session.user.role)) {
      router.push("/"); // Redirect to home if the user does not have the required role
    }
  }, [session, status, allowedRoles, router]);

  return { session, status };
}
