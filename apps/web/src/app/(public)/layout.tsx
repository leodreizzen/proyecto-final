import type React from "react";
import { Navbar } from "@/components/public-layout/navbar";
import { Footer } from "@/components/public-layout/footer";

export default function PublicLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            <Footer />
        </div>
    )
}