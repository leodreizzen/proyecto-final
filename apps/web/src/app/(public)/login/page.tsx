import { connection } from 'next/server';
import LoginPageClient from "@/app/(public)/login/login-page";
export default async function LoginPage(){
    await connection();
    return <LoginPageClient/>
}