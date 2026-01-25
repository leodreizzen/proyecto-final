"use client"

export function ScrollResetter({children, className, scrollerID}: { children: React.ReactNode, className?: string, scrollerID: string }) {
    function resetScroll() {
        document.getElementById(scrollerID)?.scrollTo(0,0);
    }

    return (
        <div className={className} onClick={resetScroll}>{children}</div>
    );
}