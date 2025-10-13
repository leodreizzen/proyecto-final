import {PrismaClient} from './generated/prisma/client.js';
let prisma: ReturnType<typeof createPrismaClient>;

function createPrismaClient(){
    return new PrismaClient(
        {
            transactionOptions: {
                maxWait: 12000,
                timeout: 10000
            },
        }
    );
}

if (process.env.NODE_ENV === 'production') {
    prisma = createPrismaClient( );
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