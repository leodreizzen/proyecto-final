import "server-only"
import {UserRole} from "@repo/db/prisma/enums";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {forbidden, unauthorized} from "next/navigation";

type ACTIONS = {
    resolution: ["create", "read", "update", "delete"],
    upload: ["create", "read", "readFile"]
};

type Resource = keyof ACTIONS;

type RolePermissions = {
    [R in Resource]?: (ACTIONS[R][number])[];
}

const guestPermissions: RolePermissions = {
    resolution: ["read"]
}

const userPermissions: RolePermissions = {
    ...guestPermissions,
}

const adminPermissions: RolePermissions = {
    ...userPermissions,
    resolution: ["create", "update", "delete"],
    upload: ["create", "read", "readFile"]
}

const GUEST = "GUEST";

const permissions: {
    [Role in UserRole | typeof GUEST]: RolePermissions
} = {
    ADMIN: adminPermissions,
    USER: userPermissions,
    GUEST: guestPermissions
}


export async function checkResourcePermission<R extends Resource>(resource: R, action: ACTIONS[R][number]) {
    const guestPermissionsForResource = permissions[GUEST][resource];
    if (guestPermissionsForResource?.includes(action))
        return;

    const session = await auth.api.getSession({headers: await headers()});
    if (!session) {
        unauthorized();
    }

    const user = session.user;
    const userRole = user.role as UserRole | null | undefined;
    if (!userRole) {
        unauthorized();
    }

    const rolePermissions = permissions[userRole];
    if (!rolePermissions[resource]?.includes(action)) {
        forbidden();
    }
}