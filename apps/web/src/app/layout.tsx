import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "next-themes";
import QueryProvider from "@/lib/actions/queryClient";
import {Toaster} from "@/components/ui/sonner"
import {SITE_CONFIG} from "../../config/site";
import {NavigationGuardProvider} from "next-navigation-guard";

export const metadata: Metadata = {
    title: {
        template: `%s - ${SITE_CONFIG.PROJECT_NAME}`,
        default: `${SITE_CONFIG.PROJECT_NAME}`
    },
    description: SITE_CONFIG.PROJECT_DESCRIPTION,
}

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <NavigationGuardProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <QueryProvider>
                    {children}
                    <Toaster position="bottom-right" richColors/>
                </QueryProvider>
            </ThemeProvider>
        </NavigationGuardProvider>
        </body>
        </html>
    );
}
