export default function MultiParagraphText({text, className, paragraphClassName}: {text: string, className?: string, paragraphClassName?: string}) {
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