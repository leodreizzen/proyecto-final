import {PrismaClient} from './generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg'
import {TableContentSchema} from "./content-blocks";

let prisma: ReturnType<typeof createPrismaClient>;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});

function createPrismaClient() {
    return new PrismaClient(
        {
            adapter,
            transactionOptions: {
                maxWait: 12000,
                timeout: 10000
            },
        }
    ).$extends({
        query: {
            $allOperations({ operation, args, query }) {
                if (!['create', 'update', 'upsert'].some(op => operation.startsWith(op))) {
                    return query(args);
                }

                // If args.data is present (create/update), validate nested content blocks if possible.
                // However, Prisma args structure is complex (can be 'create', 'connect', 'update', nested writes).
                // Validating deeply nested JSONs in a generic extension is hard.
                // Given we moved logic to Worker (ContentBlock creation), explicit Zod parsing before DB call is safer.
                // For now, I'll remove the generic 'validate' call as it was specific to the old 'Table' model which had 'content'.
                // 'ContentBlock' has 'tableContent'.
                
                return query(args);
            }
        },
        result: {
            contentBlock: {
                tableContent: {
                    needs: { tableContent: true },
                    compute(data) {
                        if (!data.tableContent) return null;
                        return TableContentSchema.parse(data.tableContent);
                    }
                }
            }
        }
    });
}

if (process.env.NODE_ENV === 'production') {
    prisma = createPrismaClient();
} else {
    const globalWithPrisma = globalThis as typeof globalThis & {
        prisma: ReturnType<typeof createPrismaClient>;
    };
    if (!globalWithPrisma.prisma) {
        globalWithPrisma.prisma = createPrismaClient();
    }
    prisma = globalWithPrisma.prisma;
}

export default prisma;
export type TransactionPrismaClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export {PrismaClientKnownRequestError} from "@prisma/client/runtime/client";
