import {authCheck} from "@/lib/auth/route-authorization";

export default async function AdminPage() {
    await authCheck(["ADMIN"]);
    return <div>Admin Page</div>;
}
