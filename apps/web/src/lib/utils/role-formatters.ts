import {UserRole} from "@repo/db/prisma/enums";

export function formatRole(role: UserRole): string {
    switch (role) {
        case UserRole.ADMIN:
            return "Administrador";
        case UserRole.USER:
            return "Usuario";
        default: {
            const _exhaustiveCheck: never = role;
            console.error("Role not recognized:", role);
            return "Desconocido";
        }
    }
}