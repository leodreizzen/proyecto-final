import {AdminDashboardEvent} from "@/app/api/events/admin/dashboard/route";
import {queryClient} from "@/lib/actions/queryClient";
import {
    maintenanceKeys,
    pendingUploadsQuery,
    resolutionKeys,
    uploadKeys, userKeys
} from "@/lib/queries/admin/queries";
import {UploadStatusData} from "@repo/pubsub/publish/uploads";
import {AdminUserEvent} from "@/lib/events";
import {compareUploads} from "@/lib/utils/sorters";

export function mountDashboardEventStream(): () => void {
    const eventSource = new EventSource('/api/events/admin/dashboard');
    eventSource.onmessage = handleAdminEvent
    return () => {
        eventSource.close();
    }
}

export function mountDashboardUserEventStream(): () => void {
    const eventSource = new EventSource('/api/events/admin/users');
    eventSource.onmessage = handleAdminUserEvent
    return () => {
        eventSource.close();
    }
}


async function handleAdminEvent(event: MessageEvent) {
    const eventData = JSON.parse(event.data) as AdminDashboardEvent;
    if (eventData.scope === "UPLOADS_SPECIFIC") {
        switch (eventData.data.type) {
            case "PROGRESS": {
                const uploadId = eventData.params.id;
                const progress = eventData.data.progress;
                await handleUploadProgress(uploadId, progress)
                break;
            }
            case "STATUS": {
                const uploadId = eventData.params.id;
                await handleUploadStatusUpdate(uploadId, eventData.data);
                break;
            }
        }
    } else if (eventData.scope === "UPLOADS_GLOBAL") {
        await queryClient.invalidateQueries({queryKey: uploadKeys.all});
        await queryClient.invalidateQueries({queryKey: ["uploads", "history"]});
    } else if (eventData.scope === "RESOLUTIONS_GLOBAL") {
        await queryClient.invalidateQueries({queryKey: resolutionKeys.all});
        await queryClient.invalidateQueries({queryKey: ['resolutions', 'missing']});
    } else if (eventData.scope === "RESOLUTIONS_SPECIFIC") {
        if (eventData.data.type === "UPDATE") {
            // Invalidate all resolution lists as we don't know which filter contains the updated resolution
            await queryClient.invalidateQueries({queryKey: ['resolutions', 'list']});
            await queryClient.invalidateQueries({queryKey: ['resolutions', 'missing']});

            await queryClient.invalidateQueries({queryKey: resolutionKeys.counts()});
            await queryClient.invalidateQueries({queryKey: resolutionKeys.details(eventData.params.id)});
        }
    } else if (eventData.scope === "MAINTENANCE_TASKS_GLOBAL") {
        if (eventData.data.type === "NEW") {
            await queryClient.invalidateQueries({queryKey: maintenanceKeys.all});
            await queryClient.invalidateQueries({queryKey: resolutionKeys.all});
        } else if (eventData.data.type === "DELETE") {
            await queryClient.invalidateQueries({queryKey: maintenanceKeys.all}); // todo optimize to remove only deleted task
            await queryClient.invalidateQueries({queryKey: resolutionKeys.all});
        }
    } else if (eventData.scope === "MAINTENANCE_TASKS_SPECIFIC") {
        if (eventData.data.type === "UPDATE") {
            await queryClient.invalidateQueries({queryKey: maintenanceKeys.all}); // todo optimize to update only specific task
            await queryClient.invalidateQueries({queryKey: resolutionKeys.all});
        }
    }
}


async function handleUploadProgress(uploadId: string, progress: number) {
    queryClient.setQueryData(pendingUploadsQuery.queryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((upload) => {
            if (upload.id === uploadId) {
                return {
                    ...upload,
                    progress: progress
                };
            } else
                return upload;
        })
    });
}


async function handleUploadStatusUpdate(uploadId: string, data: UploadStatusData) {
    const status = data.status;

    const uploadToUpdate = queryClient.getQueryData(pendingUploadsQuery.queryKey)?.find(u => u.id === uploadId);
    if (!uploadToUpdate) return;

    queryClient.setQueryData(pendingUploadsQuery.queryKey, (oldData) => {
        if (!oldData) return oldData;
        let newData: typeof oldData;
        if (status === "COMPLETED" || status === "FAILED") {
            newData = oldData.filter((upload) => upload.id !== uploadId);
        } else {
            newData = oldData.map((upload) => {
                if (upload.id === uploadId) {
                    return {
                        ...upload,
                        status
                    };
                } else
                    return upload;
            })
        }
        return newData.sort(compareUploads);
    });
    if (status === "COMPLETED" || status === "FAILED") {
        queryClient.invalidateQueries({queryKey: uploadKeys.recentFinished()});
    }
}

async function handleAdminUserEvent(event: MessageEvent) {
    const eventData = JSON.parse(event.data) as AdminUserEvent;
    if (eventData.scope === "USERS_GLOBAL") {
        queryClient.invalidateQueries({queryKey: userKeys.all});
    } else if (eventData.scope === "USERS_SPECIFIC") {
        if (eventData.data.type === "UPDATE") {
            if (eventData.data.fields.find(f => f !== "password"))
                await queryClient.invalidateQueries({queryKey: userKeys.all});
        }
    }
}
