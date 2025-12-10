import "server-only"
import prisma from "@/lib/prisma";
import {checkResourcePermission} from "@/lib/auth/data-authorization";

export async function fetchResolutionsWithStatus() {
    //TODO PAGINATION
    await checkResourcePermission("resolution", "read");

    const resolutions = await prisma.resolution.findMany({});
    return resolutions.map(resolution => ({
        ...resolution,
        status: "ok" //TODO
    }));
}