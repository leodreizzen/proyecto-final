"use server";
import {z} from "zod";
import {VoidActionResult} from "@/lib/definitions/actions";
import {CreateUserSchema, NewPasswordSchema} from "@/lib/form-schemas/admin/create-user";
import {changeUserPassword, createUser, deleteUser} from "@/lib/data/users";
import {authCheck} from "@/lib/auth/route-authorization";

export async function createUserAction(data: z.infer<typeof CreateUserSchema>): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"])
    const {name, email, role, password} = CreateUserSchema.parse(data);
    try {
        await createUser(name, email, role, password);
        return {
            success: true,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: undefined,
        };
    }
}

export async function changUserPasswordAction(_userId: string, data: z.infer<typeof NewPasswordSchema>): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"]);
    const userId = z.uuidv7().parse(_userId);
    const {password} = NewPasswordSchema.parse(data);
    try {
        await changeUserPassword(userId, password);
        return {
            success: true,
        };
    } catch(e) {
        console.error(e);
        return {
            success: false,
            error: undefined,
        };
    }
}

export async function deleteUserAction(_userId: string): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"]);
    const userId = z.uuidv7().parse(_userId);
    try {
        await deleteUser(userId);
        return {
            success: true
        }
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: undefined,
        }
    }
}

