import {fetchUsers} from "@/lib/data/users";
import {UsersView} from "@/components/admin/users-view";
import {authCheck} from "@/lib/auth/route-authorization";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Usuarios"
}

export default async function UsersPage({
                                            searchParams
                                        }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    await authCheck(["ADMIN"]);

    const resolvedSearchParams = await searchParams;
    const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";

    const users = await fetchUsers(null, q);

    return <UsersView initialUsers={users} initialSearch={q}/>
}
