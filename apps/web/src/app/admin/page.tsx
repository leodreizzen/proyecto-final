import {authCheck} from "@/lib/auth/route-authorization";
import {ResolutionsView} from "@/components/admin/resolutions-view";

export default async function AdminPage() {
    await authCheck(["ADMIN"]);
    return <ResolutionsView/>
}
