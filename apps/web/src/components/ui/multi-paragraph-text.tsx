import {ReferenceMarker} from "@/lib/processing/reference-processor";
import {TextWithReferences} from "@/components/resolution/text-with-references";
import {ReactNode} from "react";

export default function MultiParagraphText({
    text, 
    className, 
    paragraphClassName,
    referenceMarkers
}: {
    text: string, 
    className?: string, 
    paragraphClassName?: string,
    referenceMarkers?: ReferenceMarker[]
}) {
    // If no markers, simplistic render
    if (!referenceMarkers || referenceMarkers.length === 0) {
        const paragraphs = text.split('\n').filter(p => p.trim() !== '');
        return (
            <div className={className}>
                {paragraphs.map((paragraph, idx) => (
                    <p key={idx} className={paragraphClassName}>
                        {paragraph}
                    </p>
                ))}
            </div>
        );
    }

    // Logic with markers: We need to split by newline but keep track of global indices
    const paragraphs: ReactNode[] = [];

    // We split manually to track indices
    // Regex for newline: \r\n, \n, \r
    const regex = /\r\n|\n|\r/g;
    let lastIndex = 0;

    const pushParagraph = (start: number, end: number) => {
        const untrimmed = text.substring(start, end);
        // Find visible content range to handle whitespace trimming correctly
        const trimmedStartOffset = untrimmed.search(/\S|$/);
        const trimmedContent = untrimmed.substring(trimmedStartOffset).trimEnd();

        if (trimmedContent.length > 0) {
            const globalVisibleStart = start + trimmedStartOffset;
            const globalVisibleEnd = globalVisibleStart + trimmedContent.length;

            // Find overlapping markers and clip them to the visible range
            const relevantMarkers = referenceMarkers
                .filter(m => Math.max(m.start, globalVisibleStart) < Math.min(m.end, globalVisibleEnd))
                .map(m => ({
                    ...m,
                    // Clip to visible range and convert to local coordinates (0-based relative to trimmedContent)
                    start: Math.max(m.start, globalVisibleStart) - globalVisibleStart,
                    end: Math.min(m.end, globalVisibleEnd) - globalVisibleStart
                }))
                .sort((a, b) => a.start - b.start);

            paragraphs.push(
                <p key={start} className={paragraphClassName}>
                    <TextWithReferences text={trimmedContent} markers={relevantMarkers} />
                </p>
            );
        }
    };

    for (const match of text.matchAll(regex)) {
        pushParagraph(lastIndex, match.index);
        lastIndex = match.index + match[0].length;
    }
    // Last paragraph
    pushParagraph(lastIndex, text.length);

    return (
        <div className={className}>
            {paragraphs}
        </div>
    );
}