import {tool} from "ai";
import {z} from "zod";
import {getResolutionCountsByYear} from "@/lib/data/resolutions";

export const databaseInformationTool = tool({
    description: "Proporciona información sobre las resoluciones disponibles en la base de datos",
    inputSchema: z.object({}),
    strict: true,
    title: "Información sobre la base de datos de resoluciones universitarias",
    execute: async () => {
        const counts = await getResolutionCountsByYear();
        return formatCountsForLLm(counts);
    }
})

function formatCountsForLLm(counts: Awaited<ReturnType<typeof getResolutionCountsByYear>>): string {
    let result = "Información sobre las resoluciones universitarias en la base de datos:\n\n";
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    result += `Total de resoluciones: ${total}\n\n`;
    result += "Cantidad de resoluciones por año:\n";
    counts.forEach(item => {
        const latestDate = item.latestDate ? ` ${item.latestDate.toUTCString()}` : " No disponible";
        result += `- ${item.year}: ${item.count}. Ultima fecha: ${latestDate} \n`;
    });
    return result;
}