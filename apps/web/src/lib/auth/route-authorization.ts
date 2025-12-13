import {UserRole} from "@repo/db/prisma/enums";
import {auth} from "@/lib/auth/auth";
import {forbidden, unauthorized} from "next/navigation";
import {headers} from "next/headers";

export const publicRoute = Symbol("publicRoute");

export async function authCheck(roles: UserRole[] | typeof publicRoute) {
    if (roles === publicRoute) {
        return;
    }

    const session = await auth.api.getSession({headers: await headers()});
    if (!session) {
        unauthorized();
    }
    const user = session.user;
    if (!user.role || !((roles as string[]).includes(user.role))) {
        forbidden();
    }
}