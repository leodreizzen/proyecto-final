import {UserRole} from "@repo/db/prisma/enums";
import {auth} from "@/lib/auth/auth";
import {forbidden, unauthorized} from "next/navigation";
import {headers} from "next/headers";
import {AsyncLocalStorage} from 'node:async_hooks';

export const authContext = new AsyncLocalStorage<{authPerformed: boolean}>();

export async function publicRoute(fn: () => Promise<unknown>) {
    return authContext.run({authPerformed: true}, async () => {
        return fn()
    });
}

export async function restrictedRoute(roles: UserRole[], fn: () => Promise<unknown>) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) {
        unauthorized();
    }
    const user = session.user;
    if (!user.role || !((roles as string[]).includes(user.role))) {
        forbidden();
    }
    return authContext.run({authPerformed: true}, async () => {
        return fn()
    });
}