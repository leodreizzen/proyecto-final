"use client"

import React, {useState} from "react"
import {FileText, AlertTriangle, Clock, Menu, X, Moon, Sun, Monitor, LogOut, User} from "lucide-react"
import {useTheme} from "next-themes"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {usePathname, useRouter} from "next/navigation";
import {logoutClient} from "@/lib/auth/auth-client";
import Link from "next/link";

const NAV_ITEMS: {
    route: string,
    label: string,
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
    badge?: number,
}[] = [
    {route: "/admin", label: "Resoluciones", icon: FileText},
    {route: "/admin/revision", label: "Revisión", icon: AlertTriangle},
    {route: "/admin/history", label: "Historial", icon: Clock},
]


export function MobileHeader({user}: { user: { name: string, email: string } }) {
    const [open, setOpen] = useState(false)
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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <FileText className="h-4 w-4 text-primary-foreground"/>
                </div>
                <span className="text-sm font-semibold">Resoluciones</span>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {currentUser.initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{currentUser.name}</p>
                            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                        </div>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem disabled className="opacity-70">
                            <User className="mr-2 h-4 w-4"/>
                            Mi perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
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

                {/* Mobile menu */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Menu className="h-5 w-5"/>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72 bg-sidebar p-0">
                        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
                            <span className="text-sm font-semibold text-sidebar-foreground">Menú</span>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}
                                    className="text-sidebar-foreground">
                                <X className="h-5 w-5"/>
                            </Button>
                        </div>
                        <nav className="px-3 py-4 space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.route || (item.route !== "/admin" && pathname?.startsWith(item.route));
                                return (
                                <Link
                                    key={item.route}
                                    href={item.route}
                                    onClick={() => setOpen(false)}
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
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}
