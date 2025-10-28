import {parseFileResolution} from "@/parser/parser";
import * as util from "node:util";

// async function main() {
//     // const filePath = "../../downloads/CSU_RES-1-2002.pdf";
//     // const filePath = "../../downloads/CSU_RES-233-2020.pdf";
//     const filePath = "src/__tests__/parser/test_files/CSU_RES-971-2022.pdf";
//     const res = await parseFileResolution(filePath);
//     if (res.success) {
//         console.log(util.inspect(res.data, {depth: null, colors: true}));
//     } else {
//         console.error(res.error);
//     }
// }
// main().catch(console.error)

async function test(){
    const filePath = "src/__tests__/parser/test_files/CSU_RES-751-2023.pdf";
    const resPromises = Array.from({length: 3}, async (_, i) => {
        console.log(`Starting parse ${i + 1}`);
        const res = await parseFileResolution(filePath);
        if (res.success) {
            console.log(`Parse ${i + 1} success:`);
            console.log(util.inspect(res.data, {depth: null, colors: true}));
        } else {
            console.error(`Parse ${i + 1} error:`, res.error);
        }
    });
    await Promise.all(resPromises);
}

test().catch(console.error)