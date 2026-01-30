"use client"

export function ScrollResetter({children, className, scrollerSelector}: { children: React.ReactNode, className?: string, scrollerSelector: string }) {
    function resetScroll() {
        document.querySelector(scrollerSelector)?.scrollTo(0,0);
    }

    return (
        <div className={className} onClick={resetScroll}>{children}</div>
    );
}