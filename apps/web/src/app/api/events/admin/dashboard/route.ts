import {authCheck} from "@/lib/auth/route-authorization";
import {eventBus, ResolutionEvent} from "@/lib/events";

const scopesToSend = ["UPLOADS_GLOBAL", "UPLOADS_SPECIFIC", "RESOLUTIONS_GLOBAL", "RESOLUTIONS_SPECIFIC", "MAINTENANCE_TASKS_GLOBAL", "MAINTENANCE_TASKS_SPECIFIC"] as const;
export type AdminDashboardEvent = ResolutionEvent & {scope: typeof scopesToSend[number]};

export async function GET() {
    await authCheck(["ADMIN"]);
    const encoder = new TextEncoder();
    let keepAliveInterval: NodeJS.Timeout | null = null;
    let eventListener: ((event: ResolutionEvent) => void) | null = null;

    const stream = new ReadableStream({
        start(controller) {
            eventListener = (event) => {
                if (scopesToSend.includes(event.scope)) {
                    const message = `data: ${JSON.stringify(event)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                }
            }

            eventBus.on("broadcast", eventListener)
            keepAliveInterval = setInterval(() => {
                controller.enqueue(encoder.encode(': keep-alive\n\n'));
            }, 30000);
        },
        cancel() {
            if(eventListener)
                eventBus.off('broadcast', eventListener);
            if(keepAliveInterval)
                clearInterval(keepAliveInterval);
        }
    })
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}