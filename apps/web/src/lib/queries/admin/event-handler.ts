import {AdminDashboardEvent} from "@/app/api/events/admin/dashboard/route";
import {queryClient} from "@/lib/actions/queryClient";
import {
    pendingUploadsQuery,
    recentFinishedUploadsQuery,
    resolutionKeys,
    uploadKeys
} from "@/lib/queries/admin/queries";
import {UploadStatusData} from "@repo/pubsub/publish/uploads";

export function mountDashboardEventStream(): () => void {
    const eventSource = new EventSource('/api/events/admin/dashboard');
    eventSource.onmessage = handleAdminEvent
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
            await queryClient.invalidateQueries({ queryKey: ['resolutions', 'list'] });
            await queryClient.invalidateQueries({ queryKey: ['resolutions', 'missing'] });
            
            await queryClient.invalidateQueries({queryKey: resolutionKeys.counts()});
            await queryClient.invalidateQueries({queryKey: resolutionKeys.details(eventData.params.id)});
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
        if (status === "COMPLETED" || status === "FAILED") {
            return oldData.filter((upload) => upload.id !== uploadId);
        }
        return oldData.map((upload) => {
            if (upload.id === uploadId) {
                return {
                    ...upload,
                    status
                };
            } else
                return upload;
        })
    });
    if (status === "COMPLETED" || status === "FAILED") {
        const finishedUpload = {
            ...uploadToUpdate,
            status: data.status,
            errorMsg: data.status === "FAILED" ? data.errorMessage : null
        } satisfies typeof uploadToUpdate;

        queryClient.setQueryData(recentFinishedUploadsQuery.queryKey, (oldData) => {
            if (!oldData) return oldData;
            return [finishedUpload, ...oldData].slice(0, 10); // Keep only the latest 10
        });
    }
}
