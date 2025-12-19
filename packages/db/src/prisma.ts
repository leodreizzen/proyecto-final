import {PrismaClient} from './generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg'
import {TableSchema} from "./tables";

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

                if (operation === 'upsert') {
                    validate(args.create);
                    validate(args.update);
                } else {
                    const data = args.data;

                    if (Array.isArray(data)) {
                        data.forEach(validate);
                    } else {
                        validate(data);
                    }
                }
                return query(args);
            }
        },
        result: {
            table: {
                content: {
                    needs: { content: true },
                    compute(data) {
                        return TableSchema.parse(data.content);
                    }
                }
            }
        }
    });
}

const validate = (data: { content?: unknown }) => {
    if (data?.content) {
        data.content = TableSchema.parse(data.content);
    }
};

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
