export const dynamic = 'force-dynamic';
import { authCheck, publicRoute } from "@/lib/auth/route-authorization";
import { Hero } from "@/components/home/hero";
import { LatestResolutions } from "@/components/home/latest-resolutions";
import { HowItWorks } from "@/components/home/how-it-works";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function HomePage() {
    await authCheck(publicRoute);
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
            <Hero />
            
            <Suspense fallback={<LatestResolutionsSkeleton />}>
                <LatestResolutions />
            </Suspense>
            
            <HowItWorks />
        </div>
    );
}

function LatestResolutionsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
