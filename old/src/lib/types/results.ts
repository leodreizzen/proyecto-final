export type Result<T, E> = (T extends void ? {
    success: true
} : {
    success: true
    data: T
})| {
    success: false
    error: E
}