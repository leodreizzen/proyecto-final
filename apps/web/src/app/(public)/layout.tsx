import type React from "react";
import ThemeToggler from "@/components/ui/theme-toggler";

export default function PublicLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="absolute top-4 right-4">
                <ThemeToggler/>
            </div>
            <div className="size-full overflow-y-auto" id="main-scroller">
                {children}
            </div>
        </div>
    )
}