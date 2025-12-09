import rawPrisma from "@repo/db/prisma";
import {authContext} from "@/lib/auth/authorization";

const prisma = rawPrisma.$extends({
    query: {
        async $allOperations({args, query}) {
            const authStore = authContext.getStore();
            if (!authStore || !authStore.authPerformed) {
                throw new Error("Database access is not allowed without authentication.");
            }
            return query(args);
        }

    }
})
export default prisma;