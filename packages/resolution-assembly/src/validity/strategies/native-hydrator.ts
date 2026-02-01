import {
    ObjectForGraph,
    ResolutionForGraph,
    ArticleForGraph,
    AnnexForGraph,
    ChapterForGraph
} from "../types/definitions";
import {
    NodeCoordinates,
    ArticleCoords,
    AnnexCoords,
    ChapterCoords,
    ResolutionCoords
} from "../types/coordinates";
import {ValidityGraphNode} from "../domain/graph-node";
import {ValidityGraph} from "../domain/graph";
import {enforceAnnexNumber, enforceArticleNumber} from "../utils/numbers";

type HydrateResult<T> =
    | { isVirtual: false; node: ValidityGraphNode; coords: T }
    | { isVirtual: true;  node: ValidityGraphNode };

type AnyHydrateResult =
    | HydrateResult<ResolutionCoords>
    | HydrateResult<ArticleCoords>
    | HydrateResult<AnnexCoords>
    | HydrateResult<ChapterCoords>;


export class NativeHydrator {

    constructor(private graph: ValidityGraph) {}

    hydrate(payload: { type: "resolution"; object: ResolutionForGraph }): HydrateResult<ResolutionCoords>;
    hydrate(payload: { type: "article"; object: ArticleForGraph }): HydrateResult<ArticleCoords>;
    hydrate(payload: { type: "annex"; object: AnnexForGraph }): HydrateResult<AnnexCoords>;
    hydrate(payload: { type: "chapter"; object: ChapterForGraph }): HydrateResult<ChapterCoords>;
    hydrate(payload: ObjectForGraph): AnyHydrateResult;

    hydrate(payload: ObjectForGraph) {
        switch (payload.type) {
            case "resolution": return this.hydrateResolution(payload.object);
            case "article": return this.hydrateArticleAncestry(payload.object);
            case "annex": return this.hydrateAnnexAncestry(payload.object);
            case "chapter": return this.hydrateChapterAncestry(payload.object);
        }
    }

    private hydrateResolution(resolution: ResolutionForGraph): { node: ValidityGraphNode; coords: ResolutionCoords } {
        const node = this.graph.acquireNode(resolution.id);

        const coords = {
            initial: resolution.initial,
            number: resolution.number,
            year: resolution.year
        } satisfies ResolutionCoords;

        this.graph.registerBaseVersion({ type: "resolution", coords }, node);

        return {node, coords };
    }

    private hydrateAnnexAncestry(annex: AnnexForGraph): HydrateResult<AnnexCoords> {
        const node = this.graph.acquireNode(annex.id);

        let parentNode: ValidityGraphNode;
        let coords: AnnexCoords | null = null;
        let isVirtual = false;

        if (annex.resolution) {
            const resResult = this.hydrateResolution(annex.resolution);
            parentNode = resResult.node;

            coords = {
                parent: resResult.coords,
                annexNumber: enforceAnnexNumber(annex.number)
            };
        } else if (annex.newContentForChangeReplaceAnnex) {
            parentNode = this.graph.acquireNode(annex.newContentForChangeReplaceAnnex.change.id);
            isVirtual = true;
        } else {
            throw new Error(`Inconsistent annex parent data for ${annex.id}`);
        }

        node.addDependency(parentNode);

        if (!isVirtual && coords) {
            this.graph.registerBaseVersion({ type: "annex", coords }, node);
            return { isVirtual: false, node, coords };
        } else {
            return { isVirtual: true, node };
        }
    }

    private hydrateChapterAncestry(chapter: ChapterForGraph): HydrateResult<ChapterCoords> {
        const node = this.graph.acquireNode(chapter.id);

        const parentResult = this.hydrateAnnexAncestry(chapter.annex.annex);
        node.addDependency(parentResult.node);

        if (!parentResult.isVirtual) {
            const coords: ChapterCoords = {
                parent: parentResult.coords,
                chapterNumber: chapter.number
            };
            this.graph.registerBaseVersion({ type: "chapter", coords }, node);
            return { isVirtual: false, node, coords };
        } else {
            return { isVirtual: true, node };
        }
    }

    private hydrateArticleAncestry(article: ArticleForGraph): HydrateResult<ArticleCoords> {
        const node = this.graph.acquireNode(article.id);

        let parentNode: ValidityGraphNode;
        let parentCoordsObject: NodeCoordinates | null = null;

        if (article.resolution) {
            const resResult = this.hydrateResolution(article.resolution);
            parentNode = resResult.node;
            parentCoordsObject = { type: 'resolution', coords: resResult.coords };
        }
        else if (article.annex) {
            const result = this.hydrateAnnexAncestry(article.annex.annex);
            parentNode = result.node;
            if (!result.isVirtual) {
                parentCoordsObject = { type: 'annex', coords: result.coords };
            }
        }
        else if (article.chapter) {
            const result = this.hydrateChapterAncestry(article.chapter);
            parentNode = result.node;
            if (!result.isVirtual) {
                parentCoordsObject = { type: 'chapter', coords: result.coords };
            }
        }
        else if (article.newContentFrom) {
            parentNode = this.graph.acquireNode(article.newContentFrom.change.id);
        }
        else if (article.addedByChange) {
            parentNode = this.graph.acquireNode(article.addedByChange.change.id);
        }
        else {
            throw new Error(`Inconsistent article parent data for ${article.id}`);
        }

        node.addDependency(parentNode);

        if (parentCoordsObject) {
            const coords: ArticleCoords = {
                parent: parentCoordsObject,
                articleNumber: enforceArticleNumber(article.number),
                articleSuffix: article.suffix
            };

            this.graph.registerBaseVersion({ type: "article", coords }, node);

            return { isVirtual: false, node, coords };
        } else {
            return { isVirtual: true, node };
        }
    }
}