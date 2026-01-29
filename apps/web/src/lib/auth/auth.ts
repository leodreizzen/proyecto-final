import "server-only"
import {betterAuth} from "better-auth"
import {prismaAdapter} from "better-auth/adapters/prisma";
import {nextCookies} from "better-auth/next-js";
import {headers} from "next/headers";
import { admin as adminPlugin } from "better-auth/plugins"
import {ac, roles} from "@/lib/auth/data-permissions";
import prisma from "@/lib/prisma";


export const authConfig = {
    database: prismaAdapter(prisma, {
        provider: "postgresql",
        transaction: true
    }),
    advanced: {
        database: {
            generateId: false
        },
        disableOriginCheck: process.env.NODE_ENV === "development",
    },
    experimental: {joins: true},
    emailAndPassword: {
        enabled: true,
        disableSignUp: true,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
                input: false,
            }
        }
    },
    plugins: [nextCookies(), adminPlugin({
        ac: ac,
        roles: roles
    })]
} satisfies Parameters<typeof betterAuth>[0]

export const auth = betterAuth(authConfig);


export async function getSessionServer() {
    return auth.api.getSession({
        headers: await headers()
    });
}