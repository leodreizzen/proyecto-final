import {PrismaClient} from './generated/prisma/client.ts';
import {PrismaPg} from '@prisma/adapter-pg'

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
    );
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