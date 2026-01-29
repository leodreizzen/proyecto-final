import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {UserRole} from "@repo/db/prisma/enums";
import {auth, transactionAuth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {UserWhereInput} from "@repo/db/prisma/models";
import {publishDeleteUser, publishNewUser, publishUserUpdate} from "@repo/pubsub/publish/users";

export type UserListItem = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    emailVerified: boolean;
}

export async function fetchUsers(cursor: string | null, query?: string | null): Promise<UserListItem[]> {
    await checkResourcePermission("user", "list");

    const cursorParams = cursor ? {
        skip: 1,
        cursor: {
            id: cursor
        }
    } : {}

    const where = {
        deletedAt: null,
        ...(query ? {
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive' as const
                    }
                },
                {
                    email: {
                        contains: query,
                        mode: 'insensitive' as const
                    }
                }
            ]
        } : {})
    } satisfies UserWhereInput;

    const users = await prisma.user.findMany({
        ...cursorParams,
        where,
        take: 15,
        orderBy: {
            name: 'asc'
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            emailVerified: true,
        },
    });

    return users;
}

export async function createUser(name: string, email: string, role: UserRole, password: string): Promise<void> {
    await checkResourcePermission("user", "create");
    const {user} = await auth.api.createUser({
        body: {
            email,
            password,
            name,
            role,
        },
    });

    await publishNewUser(user.id);
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<void> {
    await checkResourcePermission("user", "set-password");
    await auth.api.setUserPassword({
        body: {
            userId,
            newPassword: newPassword
        },
        headers: await headers()
    });

    await publishUserUpdate(userId, ["password"]);
}

export async function deleteUser(userId: string): Promise<void> {
    await checkResourcePermission("user", "delete");
    await prisma.$transaction(async (tx) => {
        await transactionAuth(tx).api.banUser({
            body: {
                userId,
                banReason: "User deleted"
            },
            headers: await headers(),
        })
        await tx.user.update({
            where: {
                id: userId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date(),
                email: `deleted_${userId}@deleted`
            }
        })
    });

    await publishDeleteUser(userId);
}