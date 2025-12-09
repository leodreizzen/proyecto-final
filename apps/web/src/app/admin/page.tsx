import {restrictedRoute} from "@/lib/auth/authorization";

export default async function AdminPage() {
    return restrictedRoute(["ADMIN"], async () => {
        return <div>Admin Page</div>;
    })
}
