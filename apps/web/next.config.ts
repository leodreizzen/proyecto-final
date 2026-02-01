import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: "standalone",
    webpack(config, context){
        if(context.dev && process.env.POLLING?.toLowerCase() === "true"){
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
    turbopack: {

    },
    experimental: {
        authInterrupts: true
    },

    transpilePackages: ["@repo/db", "@repo/pubsub", "@repo/jobs"],
};

export default nextConfig;
