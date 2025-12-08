"use server"
import {z} from "zod";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const loginDataSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    callbackURL: z.url().optional()
})

export async function login({data}: { data: z.infer<typeof loginDataSchema> }) {
    const parsedData = loginDataSchema.parse(data);
    const result = await auth.api.signInEmail({
        body: {
            email: parsedData.email,
            password: parsedData.password,
            callbackURL: parsedData.callbackURL,
        }
    });
    if (result.redirect) {
        redirect(result.url)
    }

    return result;
}