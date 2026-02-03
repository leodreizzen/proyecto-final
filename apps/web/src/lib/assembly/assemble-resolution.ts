import { checkResourcePermission } from "@/lib/auth/data-authorization";
import { getAssembledResolution as assemble } from "@repo/resolution-assembly";
import { notFound } from "next/navigation";
import { slugToResID } from "@/lib/paths";

export async function getAssembledResolution(resolutionId: string, versionDate: Date | null, modifierStr: string | null) {
    await checkResourcePermission("resolution", "read");

    let causedBy = undefined;
    if (modifierStr) {
        causedBy = slugToResID(modifierStr) || undefined;
    }

    const result = await assemble(resolutionId, {
        date: versionDate,
        causedBy,
        exclusive: false
    });

    if (!result) {
        notFound();
    }
    return result;
}