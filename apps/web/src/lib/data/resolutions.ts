import prisma from "@/lib/prisma";
import {checkResourcePermission} from "@/lib/auth/data-authorization";

async function fetchResolutions() {
    // TODO pagination
    await checkResourcePermission("resolution", "read");
    const resolutions = await prisma.resolution.findMany();
    return resolutions;
}