import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: "standalone",
    webpack(config, context){
        if(context.dev){
            config.watchOptions = {
                poll: 500,
                aggregateTimeout: 300,
            };
        }
        return config;
    }};

export default nextConfig;
