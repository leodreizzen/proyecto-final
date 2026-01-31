import {adminAc, defaultStatements} from "better-auth/plugins/admin/access";
import {createAccessControl} from "better-auth/plugins/access";
import {Mutable} from "@/lib/definitions/util";

export const actionsStatement = {
    resolution: ["create", "read", "update", "delete"],
    upload: ["create", "read", "readFile"],
    maintenanceTask: ["read", "update"],
    ...defaultStatements
} as const;


type RolePermissions = {
    [R in Resource]?: (typeof actionsStatement[R][number])[];
}


export const guestPermissions = {
    resolution: ["read"]
} as const satisfies RolePermissions;

export const guestPermissionsTocheck: RolePermissions = guestPermissions;


const userPermissions = {
    ...guestPermissions,
} as const;

export const ac = createAccessControl(actionsStatement);
const admin = ac.newRole({
    ...adminAc.statements,
    ...userPermissions,
    resolution: ["create", "update", "delete"],
    upload: ["create", "read", "readFile"],
    maintenanceTask: ["read", "update"],
})

const user = ac.newRole({
    ...(userPermissions as Mutable<typeof userPermissions>)
})

export const roles = {
    ADMIN: admin,
    USER: user
} as const;

export type Resource = keyof typeof actionsStatement;



