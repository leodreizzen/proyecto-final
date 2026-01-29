import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {UserRole} from "@repo/db/prisma/enums";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";

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

    const where = query ? {
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
    } : {};

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
            emailVerified: true
        }
    });

    return users;
}

export async function createUser(name: string, email: string, role: UserRole, password: string): Promise<void> {
    await checkResourcePermission("user", "create");
    await auth.api.createUser({
        body: {
            email,
            password,
            name,
            role,
        },
    });
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
}