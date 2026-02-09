import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col w-full h-[calc(100dvh-4rem)] min-h-0 max-w-3xl mx-auto bg-background relative">
            {/* New Chat Button Skeleton */}
            <div className="absolute top-4 right-4 z-10">
                <Button variant="outline" size="sm" className="gap-2 bg-background/50 backdrop-blur-sm" disabled>
                    <PlusIcon className="size-4" />
                    <span>Nueva conversación</span>
                </Button>
            </div>

            {/* Conversation Area Skeleton */}
            <div className="relative flex-1 w-full px-4 pt-14 flex flex-col overflow-hidden">
                <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                    {/* Bot Message Skeleton */}
                    <div className="flex gap-4 w-full">
                        <Skeleton className="size-8 rounded-full shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>

                    {/* User Message Skeleton */}
                    <div className="flex gap-4 w-full justify-end">
                        <div className="flex-1 max-w-[80%] space-y-2">
                            <Skeleton className="h-20 w-full rounded-xl bg-muted" />
                        </div>
                    </div>

                    {/* Bot Message Skeleton */}
                    <div className="flex gap-4 w-full">
                        <Skeleton className="size-8 rounded-full shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-32 w-full rounded-md" /> {/* Table or distinct content */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="p-4 bg-background">
                <div className="border border-input rounded-xl p-2 shadow-sm bg-background flex items-end gap-2">
                    <Skeleton className="h-8 w-full bg-transparent rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0 mb-0.5" />
                </div>
            </div>
        </div>
    );
}
