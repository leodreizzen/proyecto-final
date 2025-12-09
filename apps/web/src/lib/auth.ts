import {betterAuth} from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@repo/db/prisma";
import {nextCookies} from "better-auth/next-js";

export const auth = betterAuth({
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
    experimental: { joins: true },
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
    plugins: [nextCookies()]
});