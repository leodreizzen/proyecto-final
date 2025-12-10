import { createAuthClient } from "better-auth/react"
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";
export const authClient = createAuthClient({

});

export async function logoutClient(router: AppRouterInstance) {
    const res = await authClient.signOut();
    if (res.data?.success) {
        router.push("/login");
    }
}