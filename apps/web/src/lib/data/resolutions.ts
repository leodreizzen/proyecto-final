import "server-only"
import prisma from "@/lib/prisma";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {ResolutionWithStatus} from "@/lib/definitions/resolutions";

export async function fetchResolutionsWithStatus(): Promise<ResolutionWithStatus[]> {
    //TODO PAGINATION
    await checkResourcePermission("resolution", "read");

    const resolutions = await prisma.resolution.findMany({});
    return resolutions.map(resolution => ({
        ...resolution,
        status: "ok" //TODO
    }));
}

export async function countResolutions() {
    await checkResourcePermission("resolution", "read");
    return prisma.resolution.count();
}