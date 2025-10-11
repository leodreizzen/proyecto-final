import {pdf} from "pdf-to-img";
import fs from "fs";
import path from "node:path";
import sharp from "sharp";

export const pdfFilePathToImage = async (pdf_path: string, targetWidth?: number, format?: "webp" | "png") => {
    const binaryData = fs.readFileSync(pdf_path);
    return pdfBufferToImage(binaryData, targetWidth, format);
}


export const pdfBufferToImage = async (pdf_buffer: Buffer, targetWidth?: number, format: "webp" | "png" = "webp") => {
    const document = await pdf(pdf_buffer, {
        scale: 3.0,
        docInitParams: {
            StandardFontDataFactory: FontFactory,
        },
    });

    const imgs = [];
    for await (const image of document) {
        if (targetWidth) {
            let resizedImage = sharp(Buffer.from(image))
                .resize(targetWidth, null, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
            let resizedImageBuffer;
            switch(format) {
                case "webp":
                    resizedImageBuffer = await resizedImage.webp({quality: 90}).toBuffer();
                    break;
                case "png":
                    resizedImageBuffer = await resizedImage.webp({quality: 90}).toBuffer()
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            imgs.push(resizedImageBuffer);
        } else {
            imgs.push(image);
        }
    }
    return imgs;
};

const fontCache = new Map<string, Uint8Array>();
class FontFactory {
    private readonly fontsDir: string;

    constructor() {
        const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
        this.fontsDir = path.join(pdfjsDistPath, 'standard_fonts');
    }

    async fetch(params: { filename: string }) {
        if (fontCache.has(params.filename)) {
            return fontCache.get(params.filename)!;
        }

        const fontPath = path.join(this.fontsDir, params.filename);
        if (fs.existsSync(fontPath)) {
            const fontData = new Uint8Array(fs.readFileSync(fontPath));
            fontCache.set(params.filename, fontData);
            return fontData;
        } else {
            throw new Error(`${params.filename} not found`);
        }
    }
}
