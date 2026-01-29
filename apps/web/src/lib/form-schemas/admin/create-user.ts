import z from "zod";
import {UserRole} from "@repo/db/prisma/enums";

const excludedRolesTyped = [UserRole.USER] as const;
export const excludedRoles: readonly UserRole[]  = excludedRolesTyped;

export const NewPasswordSchema = z.object({
    password: z.string().min(8, {
        message: "La contraseña debe tener al menos 8 caracteres.",
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export const CreateUserSchema = NewPasswordSchema.safeExtend({
    name: z.string().min(3, {
        message: "El nombre debe tener al menos 3 caracteres.",
    }),
    email: z.email({
        message: "Introduce un email válido.",
    }),

    role: z.enum(UserRole).exclude(excludedRolesTyped),
});
