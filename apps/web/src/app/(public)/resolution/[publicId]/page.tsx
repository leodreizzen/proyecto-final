import {notFound} from "next/navigation";

const paramsRegex = /^(\w+)-(\d+)-(\d+)$/;

function extractResId(publicId: string) {
    const match = publicId.match(paramsRegex);
    if (!match) {
        return null;
    }
    const [, initial, number, year] = match;
    return {
        initial: initial!.toUpperCase(),
        number: parseInt(number!, 10),
        year: parseInt(year!, 10)
    }
}

export default async function main({params}: {params: Promise<{publicId: string}> }){
    const {publicId} = await params;
    const resId = extractResId(publicId);
    if (!resId) {
        notFound();
    }

    return <div>
        Resolution ID: {resId.initial} - {resId.number} - {resId.year}
    </div>
}