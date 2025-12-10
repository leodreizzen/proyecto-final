import type { ReactNode } from "react"
import {Sidebar} from "@/components/admin/sidebar";
import {MobileHeader} from "@/components/admin/mobile-header";
import {auth} from "@/lib/auth/auth";
import {unauthorized} from "next/navigation";
import {headers} from "next/headers";

interface DashboardLayoutProps {
    children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        unauthorized();
    }
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar user={session.user}/>
            <div className="flex flex-1 flex-col overflow-hidden">
                <MobileHeader user={session.user}/>
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    )
}
