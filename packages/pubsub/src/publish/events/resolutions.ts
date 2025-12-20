import {publish} from "../publish.ts";

export async function publishResolutionUpdate(resolutionId: string) {
    await publish("RESOLUTIONS_SPECIFIC", {
        type: "UPDATE",
        resolutionId: resolutionId,
    }, {id: resolutionId});
}

export async function publishNewResolution(resolutionId: string) {
    await publish("RESOLUTIONS_GLOBAL", {
        type: "NEW",
        resolutionId: resolutionId,
    })
}

export async function publishDeleteResolution(resolutionId: string) {
    await publish("RESOLUTIONS_GLOBAL", {
        type: "DELETE",
        resolutionId: resolutionId,
    });
}