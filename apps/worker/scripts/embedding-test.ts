import * as util from "node:util";
import { getAssembledResolution } from "@repo/resolution-assembly";
import { getDataToEmbed } from "@/maintenance_tasks/embeddings/data-extractor";
import {addEmbeddingsToData} from "@/maintenance_tasks/embeddings/job";

const args = process.argv.slice(2);
const resolutionId = args[0];
if (!resolutionId) {
    console.error("Please provide a resolution ID as the first argument.");
    process.exit(1);
}

async function embeddingTest(resId: string) {
    const resolution = await getAssembledResolution(resId, { date: null });
    if (!resolution) {
        throw new Error(`Resolution with ID ${resId} not found.`);
    }
    const dataToEmbed = getDataToEmbed(resolution.resolutionData);

    const dataWithEmbeddings = await addEmbeddingsToData(dataToEmbed);

    console.log(util.inspect(dataWithEmbeddings, { depth: null, colors: true }));

}

embeddingTest(resolutionId).catch(console.error);