import {publicRoute} from "@/lib/auth/authorization";

export default function HomePage(){
    return publicRoute(async () => {
        return <h1>Hello world</h1>
    })
}