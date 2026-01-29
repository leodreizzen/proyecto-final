import "server-only"
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {actionsStatement, guestPermissionsTocheck, Resource} from "@/lib/auth/data-permissions";
import {forbidden, unauthorized} from "next/navigation";

export async function checkResourcePermission<R extends Resource>(resource: R, action: typeof actionsStatement[R][number]) {
    const guestPermissionsForResource = guestPermissionsTocheck[resource];
    if (guestPermissionsForResource?.includes(action))
        return;

    const session = await auth.api.getSession({headers: await headers()});
    if (!session) {
        unauthorized();
    }

    const {success: hasPermission} = await auth.api.userHasPermission({
            body: {
                permission: {
                    [resource]: [action]
                },
                userId: session.user.id
            }
        }
    )

    if (!hasPermission) {
        forbidden();
    }
}