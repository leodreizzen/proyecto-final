import {parseFileResolution} from "@/parser/parser";
import * as util from "node:util";

async function main() {
    // const filePath = "../../downloads/CSU_RES-1-2002.pdf";
    const filePath = "../../downloads/CSU_RES-620-2024.pdf";
    const res = await parseFileResolution(filePath);
    if (res.success) {
        console.log(util.inspect(res.data, {depth: null, colors: true}));
    } else {
        console.error(res.error);
    }
}


main().catch(console.error)