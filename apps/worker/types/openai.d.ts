import "openai/resources";

declare module "openai/resources" {
    interface ChatCompletionContentPartText {
        cache_control?: {
            type: "ephemeral" | "persistent";
        };
    }
}