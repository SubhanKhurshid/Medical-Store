import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export function authorizeRoles(...allowedRoles: string[]) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) => {
    const session = await getSession({ req });
    const user = session?.user;

    if (user && allowedRoles.includes(user.role)) {
      return next();
    } else {
      res.status(403).end("Forbidden");
    }
  };
}
