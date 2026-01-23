import {ArticleToShow} from "@/lib/definitions/resolutions";
import {ArticleView} from "@/components/resolution/article-view";
import {cn} from "@/lib/utils";
import {getArticleId} from "@/lib/utils/resolution-formatters";

export default function ArticlesContainer({articles, className, idPrefix}: { articles: ArticleToShow[], className?: string, idPrefix?: string }) {
    return (
        <div className={cn("flex flex-col gap-5", className)}>
            {articles.map((article, idx) => (
                <ArticleView 
                    key={idx} 
                    article={article}
                    htmlId={idPrefix ? getArticleId(idPrefix, article.number, article.suffix) : undefined}
                />
            ))}
        </div>
    )
}
