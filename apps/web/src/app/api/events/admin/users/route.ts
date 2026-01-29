import {authCheck} from "@/lib/auth/route-authorization";
import {AdminUserEvent, eventBus} from "@/lib/events";

const scopesToSend = ["USERS_GLOBAL", "USERS_SPECIFIC"] as const;

export async function GET() {
    await authCheck(["ADMIN"]);
    const encoder = new TextEncoder();
    let keepAliveInterval: NodeJS.Timeout | null = null;
    let eventListener: ((event: AdminUserEvent) => void) | null = null;

    const stream = new ReadableStream({
        start(controller) {
            eventListener = (event) => {
                if (scopesToSend.includes(event.scope)) {
                    const message = `data: ${JSON.stringify(event)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                }
            }

            eventBus.on("user", eventListener)
            keepAliveInterval = setInterval(() => {
                controller.enqueue(encoder.encode(': keep-alive\n\n'));
            }, 30000);
        },
        cancel() {
            if(eventListener)
                eventBus.off('user', eventListener);
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