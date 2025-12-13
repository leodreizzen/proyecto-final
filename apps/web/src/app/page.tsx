import {authCheck, publicRoute} from "@/lib/auth/route-authorization";

export default async function HomePage() {
    await authCheck(publicRoute);
    return <h1>Hello world</h1>
}