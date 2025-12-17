export type VoidActionResult<E> = {
    success: true,
} | {
    success: false;
    error: E;
}

export type ActionResult<T, E> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
}