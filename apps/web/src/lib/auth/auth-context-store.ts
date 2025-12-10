import { AsyncLocalStorage } from 'node:async_hooks';
export const authContext = new AsyncLocalStorage<{authPerformed: boolean}>();