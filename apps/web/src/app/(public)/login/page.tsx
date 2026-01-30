import {connection} from 'next/server';
import LoginPageClient from "@/app/(public)/login/login-page";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Login",
    robots: {
        index: false,
        follow: false,
    },
}

export default async function LoginPage() {
    await connection();
    return <LoginPageClient/>
}