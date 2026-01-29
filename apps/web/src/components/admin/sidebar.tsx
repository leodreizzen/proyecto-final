"use client"

import {cn} from "@/lib/utils"
import {FileText, AlertTriangle, Clock, Moon, Sun, Monitor, LogOut, User} from "lucide-react"
import {useTheme} from "next-themes"
import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {logoutClient} from "@/lib/auth/auth-client";
import {usePathname, useRouter} from "next/navigation";
import Link from "next/link";

const NAV_ITEMS: {
    route: string,
    label: string,
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
    badge?: number,
}[] = [
    {route: "/admin", label: "Resoluciones", icon: FileText},
    {route: "/admin/revision", label: "Revisión", icon: AlertTriangle}, // TODO: dynamic badge?
    {route: "/admin/history", label: "Historial", icon: Clock},
    {route: "/admin/users", label: "Usuarios", icon: User},
]


export function Sidebar({user}: { user: { name: string, email: string } }) {
    const {setTheme} = useTheme()
    const router = useRouter();
    const pathname = usePathname();
    
    const currentUser = {
        name: user.name,
        email: user.email,
        initials: user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase(),
    }

    async function handleLogout() {
        await logoutClient(router);
    }

    return (
        <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                    <FileText className="h-5 w-5 text-sidebar-primary-foreground"/>
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-sidebar-foreground">Gestor de</h1>
                    <p className="text-xs text-sidebar-muted">Resoluciones</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.route || (item.route !== "/admin" && pathname?.startsWith(item.route));
                    return (
                    <Link
                        key={item.route}
                        href={item.route}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                    >
                        <item.icon className="h-5 w-5"/>
                        <span>{item.label}</span>
                        {item.badge && (
                            <span
                                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-status-warning/20 px-1.5 text-xs font-medium text-status-warning">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                )})}
            </nav>

            <div className="px-3 py-4 border-t border-sidebar-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                                    {currentUser.initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-sm font-medium">{currentUser.name}</span>
                                <span
                                    className="text-xs text-sidebar-muted truncate max-w-[140px]">{currentUser.email}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem disabled className="flex items-center gap-2 opacity-70">
                            <User className="h-4 w-4"/>
                            <span>Mi perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        {/* Theme options */}
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4"/>
                            Tema claro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4"/>
                            Tema oscuro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Monitor className="mr-2 h-4 w-4"/>
                            Tema del sistema
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={handleLogout} className="text-status-error focus:text-status-error">
                            <LogOut className="mr-2 h-4 w-4"/>
                            Cerrar sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}
