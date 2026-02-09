import "server-only";
import {cookies} from "next/headers";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

export async function getTokenFromCookies(): Promise<string | null> {
    const userCookies = await cookies();
    return userCookies.get("chat-token")?.value || null;
}

export async function createAndSetNewToken(): Promise<void> {
    const tokenBits = 128;
    const token = crypto.randomBytes(Math.ceil(tokenBits)).toString('hex').slice(0, tokenBits * 2);
    const userCookies = await cookies();
    userCookies.set({
        name: "chat-token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 30),
    });
}

export async function extendTokenExpiration(): Promise<void> {
    const userCookies = await cookies();
    const token = userCookies.get("chat-token")?.value;
    if (token) {
        userCookies.set({
            name: "chat-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(Date.now() + 1000 * 60 * 60 * 30),
        });
    }
}

export async function compareTokens(token: string, tokenHash: string): Promise<boolean> {
    return bcrypt.compare(token, tokenHash);
}

export async function hashToken(token: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
}