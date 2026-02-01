import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {getAssembledResolution as assemble} from "@repo/resolution-assembly";
import {notFound} from "next/navigation";

export async function getAssembledResolution(resolutionId: string, versionDate: Date | null) {
    await checkResourcePermission("resolution", "read");
    const result = await assemble(resolutionId, versionDate);
    if (!result) {
        notFound();
    }
    return result;
}