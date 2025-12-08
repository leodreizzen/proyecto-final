import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: "standalone",
    webpack(config, context){
        if(context.dev){
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
    transpilePackages: ["@repo/db"],
};

export default nextConfig;
