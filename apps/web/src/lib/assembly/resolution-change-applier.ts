import {
    AnnexToShow,
    ArticleToShow,
    ChapterToShow,
    ContentBlock,
    ResolutionNaturalID,
    ResolutionToShow,
    TableToShow
} from "@/lib/definitions/resolutions";
import {sortChangeWithContext} from "@/lib/assembly/utils";
import {ChangeWithContextForAssembly} from "@/lib/definitions/changes";
import {checkReference} from "@/lib/data/polymorphism/reference";
import {ReferenceWithConcreteWithoutPayload} from "@/lib/definitions/references";
import {applyTextModification} from "@/lib/assembly/text-processor";
import {articleInitialDataToShow} from "@/lib/data/remapping/article-to-show";
import {annexInitialDataToShow} from "@/lib/data/remapping/annex-to-show";
import {parseToContentBlocks} from "@/lib/utils/content-block-parser";

type ResolutionID = ResolutionNaturalID;

function contentBlocksToText(blocks: ContentBlock[]): string {
    return blocks.map(b => {
        if (b.type === "text") return b.value;
        if (b.type === "table") return `{{tabla ${b.table.number}}}`;
        return "";
    }).join("");
}

function getTablesFromBlocks(blocks: ContentBlock[]): TableToShow[] {
    const tables: TableToShow[] = [];
    for (const block of blocks) {
        if (block.type === "table") {
            tables.push(block.table);
        }
    }
    return tables;
}

abstract class Slot<T> {
    abstract get relevant(): boolean;
    abstract get exists(): boolean;
    abstract get(): T | undefined;
    abstract set(value: T, by: ResolutionID): void;
    abstract repeal(by: ResolutionID): void;
    abstract modify(before: string, after: string, by: ResolutionID): boolean;
}

class IrrelevantSlot<T> extends Slot<T> {
    get relevant() { return false; }
    get exists() { return false; }
    get() { return undefined; }
    set(_: T, __: ResolutionID) {}
    repeal(_: ResolutionID) {}
    modify(_before: string, _after: string, _by: ResolutionID) { return false; }
}

abstract class ResolutionSlot extends Slot<ResolutionToShow> {
    abstract ratify(by: ResolutionID): void;
}

class ConcreteResolutionSlot extends ResolutionSlot {
    constructor(
        private getter: () => ResolutionToShow,
        private setter: (val: ResolutionToShow) => void
    ) {
        super();
    }

    get relevant() { return true; }
    get exists() { return true; }
    get() { return this.getter(); }
    set(value: ResolutionToShow, _: ResolutionID) { this.setter(value); } 
    repeal(by: ResolutionID) {
        const obj = this.getter();
        if (obj) obj.repealedBy = by;
    }
    ratify(by: ResolutionID) {
        const obj = this.getter();
       obj.ratifiedBy = by;
    }
    modify(_before: string, _after: string, _by: ResolutionID) {
        // Resolutions themselves don't have text to modify via this mechanism directly yet
        return false; 
    }
}

class IrrelevantResolutionSlot extends ResolutionSlot {
    get relevant() { return false; }
    get exists() { return false; }
    get() { return undefined; }
    set(_: ResolutionToShow, __: ResolutionID) {}
    repeal(_: ResolutionID) {}
    ratify(_: ResolutionID) {}
    modify(_before: string, _after: string, _by: ResolutionID) { return false; }
}

type CollectionItem = { 
    repealedBy: ResolutionID | null, 
    addedBy: ResolutionID | null,
    modifiedBy?: ResolutionID[]
};

abstract class BaseCollectionSlot<T extends CollectionItem> extends Slot<T> {
    constructor(protected container: T[]) {
        super();
    }

    get relevant() { return true; }

    get exists() {
        return this.container.some(item => this.matches(item));
    }

    get() {
        return this.container.find(item => this.matches(item));
    }

    set(value: T, by: ResolutionID) {
        this.patch(value);
        const index = this.container.findIndex(item => this.matches(item));
        if (index !== -1) {
            // Replace -> ModifiedBy
            const existing = this.container[index]!;
            value.addedBy = existing.addedBy;
            value.modifiedBy = existing.modifiedBy ? [...existing.modifiedBy, by] : [by];
            this.container[index] = value;
        } else {
            // Add -> AddedBy
            value.addedBy = by;
            value.modifiedBy = [];
            this.container.push(value);
        }
    }

    repeal(by: ResolutionID) {
        const item = this.get();
        if (item) {
            item.repealedBy = by;
        }
    }

    // Default implementation returns false, override in specific slots
    modify(_before: string, _after: string, _by: ResolutionID): boolean {
        return false;
    }

    protected abstract matches(item: T): boolean;
    protected abstract patch(item: T): void;
}

class ArticleSlot extends BaseCollectionSlot<ArticleToShow> {
    constructor(
        container: ArticleToShow[],
        private number: number,
        private suffix: number
    ) {
        super(container);
    }

    protected matches(item: ArticleToShow): boolean {
        return item.number === this.number && item.suffix === this.suffix;
    }

    protected patch(item: ArticleToShow): void {
        item.number = this.number;
        item.suffix = this.suffix;
    }

    modify(before: string, after: string, by: ResolutionID): boolean {
        const item = this.get();
        if (!item) return false;

        const currentText = contentBlocksToText(item.content);
        const modifiedText = applyTextModification(currentText, before, after);
        if (modifiedText === null) {
            return false;
        }

        const tables = getTablesFromBlocks(item.content);
        item.content = parseToContentBlocks(modifiedText, tables);
        item.modifiedBy = item.modifiedBy ? [...item.modifiedBy, by] : [by];
        return true;
    }
}

class AnnexSlot extends BaseCollectionSlot<AnnexToShow> {
    constructor(
        container: AnnexToShow[],
        private number: number
    ) {
        super(container);
    }

    protected matches(item: AnnexToShow): boolean {
        return item.number === this.number;
    }

    protected patch(item: AnnexToShow): void {
        item.number = this.number;
    }

    modify(before: string, after: string, by: ResolutionID): boolean {
        const item = this.get();
        if (!item || item.type !== "TEXT") return false;

        const currentText = contentBlocksToText(item.content);
        const modifiedText = applyTextModification(currentText, before, after);
        if (modifiedText === null) {
            return false;
        }

        const tables = getTablesFromBlocks(item.content);
        item.content = parseToContentBlocks(modifiedText, tables);
        item.modifiedBy = item.modifiedBy ? [...item.modifiedBy, by] : [by];
        return true;
    }
}

class ChapterSlot extends BaseCollectionSlot<ChapterToShow> {
    constructor(
        container: ChapterToShow[],
        private number: number
    ) {
        super(container);
    }

    protected matches(item: ChapterToShow): boolean {
        return item.number === this.number;
    }

    protected patch(item: ChapterToShow): void {
        item.number = this.number;
    }
}

export class ResolutionChangeApplier {
    inapplicableChanges: ChangeWithContextForAssembly[] = [];

    constructor(private resolution: ResolutionToShow) {
    }

    applyChanges(changes: ChangeWithContextForAssembly[]) {
        const sortedChanges = changes.toSorted(sortChangeWithContext);
        sortedChanges.forEach((c) => this.applyChange(c))
    }

    applyChange(change: ChangeWithContextForAssembly) {
        switch (change.type) {
            case "REPEAL":
                this.applyRepealChange(change);
                break;
            case "ADD_ARTICLE":
                this.applyAddArticleChange(change);
                break;
            case "ADD_ANNEX":
                this.applyAddAnnexChange(change);
                break;
            case "REPLACE_ARTICLE":
                this.applyReplaceArticleChange(change);
                break;
            case "REPLACE_ANNEX":
                this.applyReplaceAnnexChange(change);
                break;
            case "MODIFY_ARTICLE":
                this.applyModifyArticleChange(change);
                break;
            case "MODIFY_TEXT_ANNEX":
                this.applyModifyTextAnnexChange(change);
                break;
            case "ADVANCED":
                this.inapplicableChanges.push(change);
                break;
            case "APPLY_MODIFICATIONS_ANNEX":
                // ignore the change
                break;
            case "RATIFY_AD_REFERENDUM":
                 this.applyRatifyChange(change);
                 break;
            default: {
                const _exhaustiveCheck: never = change;
                this.inapplicableChanges.push(change);
            }
        }
    }

    getUpdatedResolution(): ResolutionToShow {
        return structuredClone(this.resolution);
    }

    private applyRepealChange(change: ChangeWithContextForAssembly & { type: "REPEAL" }) {
        const targetRef = checkReference(change.changeRepeal.target);
        const slot = this.getSlotFromRef(targetRef);

        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (!slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }
        slot.repeal(change.context.rootResolution);
    }

    private applyRatifyChange(change: ChangeWithContextForAssembly & { type: "RATIFY_AD_REFERENDUM" }) {
        const targetRef = change.changeRatifyAdReferendum.targetResolution;
         const slot = this.getResolutionSlot({
             initial: targetRef.initial,
             number: targetRef.number,
             year: targetRef.year
         });

         if (!slot.relevant) return;

         slot.ratify(change.context.rootResolution);
    }


    private applyAddArticleChange(change: ChangeWithContextForAssembly & { type: "ADD_ARTICLE" }) {
        const changeAddArticle = change.changeAddArticle;
        const articleToAdd = changeAddArticle.newArticle;
        if (!articleToAdd) {
            throw new Error("Article to add is missing for change " + change.id);
        }

        let slot: Slot<ArticleToShow> | null;
        const coords = {
            articleNumber: changeAddArticle.newArticleNumber!, // TODO case when number is autogenerated
            articleSuffix: changeAddArticle.newArticleSuffix || 0
        };

        if (changeAddArticle.targetResolution) {
            slot = this.getArticleSlot(
                changeAddArticle.targetResolution,
                coords
            );
        } else if (changeAddArticle.targetAnnex) {
            slot = this.getArticleSlot(
                {
                    initial: changeAddArticle.targetAnnex.initial,
                    number: changeAddArticle.targetAnnex.resNumber,
                    year: changeAddArticle.targetAnnex.year
                },
                {
                    annexNumber: changeAddArticle.targetAnnex.annexNumber,
                    ...coords
                }
            );
        } else if (changeAddArticle.targetChapter) {
            slot = this.getArticleSlot(
                {
                    initial: changeAddArticle.targetChapter.initial,
                    number: changeAddArticle.targetChapter.resNumber,
                    year: changeAddArticle.targetChapter.year
                },
                {
                    annexNumber: changeAddArticle.targetChapter.annexNumber,
                    chapterNumber: changeAddArticle.targetChapter.chapterNumber,
                    ...coords
                }
            );
        } else {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }

        const convertedArticle = articleInitialDataToShow(articleToAdd, {
            number: coords.articleNumber,
            suffix: coords.articleSuffix
        });
        slot.set(convertedArticle, change.context.rootResolution);
    }

    private applyAddAnnexChange(change: ChangeWithContextForAssembly & { type: "ADD_ANNEX" }) {
        const changeAddAnnex = change.changeAddAnnex;
        const annexToAdd = changeAddAnnex.annexToAdd?.annex;
        if (!annexToAdd) {
            throw new Error("Annex to add is missing for change " + change.id);
        }

        let slot: Slot<AnnexToShow> | null;
        if (changeAddAnnex.targetResolution) {
            slot = this.getAnnexSlot(
                changeAddAnnex.targetResolution,
                changeAddAnnex.newAnnexNumber! // TODO case when number is autogenerated
            );
        } else {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }
        // TODO subannex

        const convertedAnnex = annexInitialDataToShow(annexToAdd, {
            number: changeAddAnnex.newAnnexNumber!
        });
        slot.set(convertedAnnex, change.context.rootResolution);
    }

    private applyReplaceArticleChange(change: ChangeWithContextForAssembly & { type: "REPLACE_ARTICLE" }) {
        const changeReplace = change.changeReplaceArticle;
        const targetRef = changeReplace.targetArticle;

        const slot = this.getArticleSlot(
            {initial: targetRef.initial, number: targetRef.resNumber, year: targetRef.year},
            {
                annexNumber: targetRef.annexNumber,
                chapterNumber: targetRef.chapterNumber,
                articleNumber: targetRef.articleNumber,
                articleSuffix: targetRef.articleSuffix
            }
        );

        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (!slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }

        const newContent = changeReplace.newContent;
        if (!newContent) {
            throw new Error("New content missing for Replace Article change " + change.id);
        }

        const convertedArticle = articleInitialDataToShow(newContent, {
            number: targetRef.articleNumber,
            suffix: targetRef.articleSuffix
        });

        slot.set(convertedArticle, change.context.rootResolution);
    }

    private applyReplaceAnnexChange(change: ChangeWithContextForAssembly & { type: "REPLACE_ANNEX" }) {
        const changeReplace = change.changeReplaceAnnex;
        const targetRef = changeReplace.targetAnnex;

        const slot = this.getAnnexSlot(
            {initial: targetRef.initial, number: targetRef.resNumber, year: targetRef.year},
            targetRef.annexNumber
        );
        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (!slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }
        let newContent
        if (changeReplace.newContentType === "INLINE") {
            const newInlineAnnex = changeReplace.newInlineAnnex;
            if (!newInlineAnnex) {
                throw new Error("New inline annex missing for Replace Annex change " + change.id);
            }
            newContent = newInlineAnnex;
        } else if (changeReplace.newContentType === "REFERENCE") {
            const newAnnexReference = changeReplace.newAnnexReference;
            if (!newAnnexReference) {
                throw new Error("New annex reference missing for Replace Annex change " + change.id);
            }
            newContent = newAnnexReference.annex;
        }
        if (!newContent) {
            console.error("New content missing for Replace Annex change " + change.id);
            this.inapplicableChanges.push(change)
            return;
        }
        const convertedAnnex = annexInitialDataToShow(newContent, {
            number: targetRef.annexNumber
        });
        slot.set(convertedAnnex, change.context.rootResolution);
    }

    private applyModifyArticleChange(change: ChangeWithContextForAssembly & { type: "MODIFY_ARTICLE" }) {
        const changeModify = change.changeModifyArticle;
        const targetRef = changeModify.targetArticle;

        const slot = this.getArticleSlot(
            {initial: targetRef.initial, number: targetRef.resNumber, year: targetRef.year},
            {
                annexNumber: targetRef.annexNumber,
                chapterNumber: targetRef.chapterNumber,
                articleNumber: targetRef.articleNumber,
                articleSuffix: targetRef.articleSuffix
            }
        );

        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (!slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }

        const success = slot.modify(
            changeModify.before, 
            changeModify.after, 
            change.context.rootResolution
        );

        if (!success) {
            this.inapplicableChanges.push(change);
        }
    }

    private affectsCurrentResolution(target: { initial: string, number: number, year: number }): boolean {
        return this.resolution.id.initial === target.initial &&
            this.resolution.id.number === target.number &&
            this.resolution.id.year === target.year;
    }

    private applyModifyTextAnnexChange(change: ChangeWithContextForAssembly & { type: "MODIFY_TEXT_ANNEX" }) {
        const changeModify = change.changeModifyTextAnnex;
        const targetRef = changeModify.targetAnnex;

        const slot = this.getAnnexSlot(
            {initial: targetRef.initial, number: targetRef.resNumber, year: targetRef.year},
            targetRef.annexNumber
        );

        if (!slot) {
            this.inapplicableChanges.push(change);
            return;
        }

        if (!slot.relevant) return;

        if (!slot.exists) {
            this.inapplicableChanges.push(change);
            return;
        }

        const annex = slot.get();
        if (!annex || annex.type !== "TEXT") {
            this.inapplicableChanges.push(change);
            return;
        }

        slot.modify(changeModify.before, changeModify.after, change.context.rootResolution);
    }


    private getSlotFromRef(ref: ReferenceWithConcreteWithoutPayload): Slot<any> | null {
        switch (ref.targetType) {
            case "RESOLUTION":
                return this.getResolutionSlot(ref.resolution);
            case "ARTICLE":
                return this.getArticleSlot(
                    {initial: ref.article.initial, number: ref.article.resNumber, year: ref.article.year},
                    {
                        annexNumber: ref.article.annexNumber,
                        chapterNumber: ref.article.chapterNumber,
                        articleNumber: ref.article.articleNumber,
                        articleSuffix: ref.article.articleSuffix
                    }
                );
            case "ANNEX":
                return this.getAnnexSlot(
                    {initial: ref.annex.initial, number: ref.annex.resNumber, year: ref.annex.year},
                    ref.annex.annexNumber
                );
            case "CHAPTER":
                return this.getChapterSlot(
                    {initial: ref.chapter.initial, number: ref.chapter.resNumber, year: ref.chapter.year},
                    {annexNumber: ref.chapter.annexNumber, chapterNumber: ref.chapter.chapterNumber}
                );
            default:
                return new IrrelevantSlot();
        }
    }

    private getResolutionSlot(target: { initial: string, number: number, year: number }): ResolutionSlot {
        if (!this.affectsCurrentResolution(target)) {
            return new IrrelevantResolutionSlot();
        }
        return new ConcreteResolutionSlot(
            () => this.resolution,
            (val) => { this.resolution = val; }
        );
    }

    private getArticleSlot(
        resId: { initial: string, number: number, year: number },
        coords: {
            annexNumber?: number | null,
            chapterNumber?: number | null,
            articleNumber: number,
            articleSuffix: number
        }
    ): ArticleSlot | IrrelevantSlot<ArticleToShow> | null {
        if (!this.affectsCurrentResolution(resId)) {
            return new IrrelevantSlot();
        }

        let container: ArticleToShow[];

        if (coords.annexNumber) {
            const annex = this.resolution.annexes.find(a => a.number === coords.annexNumber);
            if (!annex) return null;
            if (annex.type !== "WITH_ARTICLES") return null;

            if (coords.chapterNumber) {
                const chapter = annex.chapters.find(c => c.number === coords.chapterNumber);
                if (!chapter) return null;
                container = chapter.articles;
            } else {
                container = annex.standaloneArticles;
            }
        } else {
            container = this.resolution.articles;
        }

        return new ArticleSlot(container, coords.articleNumber, coords.articleSuffix);
    }


    private getAnnexSlot(
        resId: { initial: string, number: number, year: number },
        annexNumber: number
    ): AnnexSlot | IrrelevantSlot<AnnexToShow> | null {
        if (!this.affectsCurrentResolution(resId)) {
            return new IrrelevantSlot();
        }
        return new AnnexSlot(this.resolution.annexes, annexNumber);
    }

    private getChapterSlot(
        resId: { initial: string, number: number, year: number },
        loc: { annexNumber: number, chapterNumber: number }
    ): ChapterSlot | IrrelevantSlot<ChapterToShow> | null {
        if (!this.affectsCurrentResolution(resId)) {
            return new IrrelevantSlot();
        }
        const annex = this.resolution.annexes.find(a => a.number === loc.annexNumber);
        if (!annex || annex.type !== "WITH_ARTICLES") return null;

        return new ChapterSlot(annex.chapters, loc.chapterNumber);
    }
}