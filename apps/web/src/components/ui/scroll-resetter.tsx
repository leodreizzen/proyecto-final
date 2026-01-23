"use client"

export function ScrollResetter({children, className}: { children: React.ReactNode, className?: string }) {
    function resetScroll() {
        document.getElementById("main-scroller")?.scrollTo(0,0);
    }

    return (
        <div className={className} onClick={resetScroll}>{children}</div>
    );
}