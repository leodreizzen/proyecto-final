import {Job} from "bullmq";
import prisma from "@repo/db/prisma";
import {parseResolution, ParseResolutionResult} from "@/parser/parser";
import {deleteAsset, fetchAsset, makeResolutionFilePublic} from "@/util/assets";
import {saveParsedResolution} from "@/data/save-resolution/save-resolution";
import {Asset} from "@repo/db/prisma/client";
import {formatErrorMessage, ResolutionRejectError} from "@/upload/errors";
import {fetchUploadWithFile, setUploadStatus} from "@/data/uploads";
import ProgressReporter from "@/util/progress-reporter";

export async function processResolutionUpload(job: Job, progressReporter: ProgressReporter) {
    if (!job.id)
        throw new Error("Job ID is missing");

    const fetchDataReporter = progressReporter.addSubreporter("fetchData", 0.14);
    const parseResolutionReporter = progressReporter.addSubreporter("parseResolution", 140);
    const saveDataReporter = progressReporter.addSubreporter("saveData", 0.5);

    const upload = await fetchUploadWithFile(job.id);
    if (!upload) {
        throw new Error(`Upload with ID ${job.data.uploadId} not found`);
    }

    let publicFile: Asset | null = null;
    try {
        await setUploadStatus({upload, status: "PROCESSING"});

        if (!upload.file) {
            throw new Error(`Upload with ID ${job.data.uploadId} has no associated file`);
        }

        const file = await fetchAsset(upload.file);
        fetchDataReporter.reportProgress(1);

        const parseResult = await parseResolution(file, parseResolutionReporter);
        const parsedResolution = checkParseResult(parseResult);

        const createdFile = await makeResolutionFilePublic(upload.file, parsedResolution.id);
        publicFile = createdFile;

        await prisma.$transaction(async (tx) => {
            await saveParsedResolution(tx, parsedResolution, upload, createdFile);
            await setUploadStatus({upload, status: "COMPLETED", tx});
        });
        saveDataReporter.reportProgress(1);
    } catch (e) {
        console.error("Error processing resolution upload:", e);
        await setUploadStatus({upload, status: "FAILED", errorMessage: formatErrorMessage(e)});
        if (publicFile) {
            await deleteAsset(publicFile);
        }
        throw e
    }

    await tryDeleteOriginalFile(upload.file);
}

function checkParseResult(parseResult: ParseResolutionResult) {
    if (!parseResult.success) {
        throw new ResolutionRejectError(parseResult.error);
    }
    return parseResult.data;
}

async function tryDeleteOriginalFile(file: Asset) {
    try {
        await deleteAsset(file);
    } catch (e) {
        console.error("Failed to delete original upload file:", e);
        // don`t fail the job if deletion fails
    }
}
