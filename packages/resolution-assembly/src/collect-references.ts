// Collect all references for bulk validation
import {findResolutionInitialData} from "./data/resolutions";
import {PrismaContentBlockWithReferences} from "./definitions/content-blocks";
import {TextReferenceWithReference} from "./definitions/references";
import {checkConcreteChange} from "@repo/db/utils/polymorphism/change";
import {checkAnnex} from "@repo/db/utils/polymorphism/annex";
import {ChangeWithContextForAssembly} from "./definitions/changes";

type ResolutionDBDataToShow = NonNullable<Awaited<ReturnType<typeof findResolutionInitialData>>>;

export function collectReferencesFromResolution(resolution: ResolutionDBDataToShow) {
    const allReferences: TextReferenceWithReference[] = [];

    resolution.recitals.forEach(r => collectReferencesFromBlocks(r.content, allReferences));
    resolution.considerations.forEach(c => collectReferencesFromBlocks(c.content, allReferences));
    resolution.articles.forEach(a => collectReferencesFromBlocks(a.content, allReferences));
    resolution.annexes.forEach(a => {
        if (a.annexText) collectReferencesFromBlocks(a.annexText.content, allReferences);
        if (a.annexWithArticles) {
            a.annexWithArticles.standaloneArticles.forEach(sa => collectReferencesFromBlocks(sa.content, allReferences));
            a.annexWithArticles.chapters.forEach(c => {
                c.articles.forEach(art => collectReferencesFromBlocks(art.content, allReferences));
            });
        }
    });
    return allReferences;
}


export function collectReferencesFromChanges(changes: ChangeWithContextForAssembly[]) {
    const allReferences: TextReferenceWithReference[] = [];

    function collectReferencesFromChange(ch: ChangeWithContextForAssembly) {
        const c = checkConcreteChange(ch);
        if (c.changeModifyArticle) {
            collectReferencesFromBlocks(c.changeModifyArticle.before, allReferences);
            collectReferencesFromBlocks(c.changeModifyArticle.after, allReferences);
        } else if (c.changeReplaceArticle) {
            if (c.changeReplaceArticle.newContent?.content)
                collectReferencesFromBlocks(c.changeReplaceArticle.newContent.content, allReferences);
        } else if (c.changeAddArticle) {
            if (c.changeAddArticle.newArticle) {
                const newArticle = c.changeAddArticle.newArticle
                collectReferencesFromBlocks(newArticle.content, allReferences);
            }
        } else if (c.changeModifyTextAnnex) {
            collectReferencesFromBlocks(c.changeModifyTextAnnex.before, allReferences);
            collectReferencesFromBlocks(c.changeModifyTextAnnex.after, allReferences);
        } else if (c.changeAddAnnex) {
            const annexToAdd = c.changeAddAnnex.annexToAdd?.annex;
            if (annexToAdd) {
                collectReferencesFromAnnex(annexToAdd)
            }
        } else if (c.changeReplaceAnnex) {
            const newInlineAnnex = c.changeReplaceAnnex.newInlineAnnex;
            if (newInlineAnnex) {
                collectReferencesFromAnnex(newInlineAnnex)
            }
            const referencedAnnex = c.changeReplaceAnnex.newAnnexReference?.annex;
            if (referencedAnnex) {
                collectReferencesFromAnnex(referencedAnnex)
            }
        }
    }

    function collectReferencesFromAnnex(annex: NonNullable<NonNullable<typeof changes[number]["changeAddAnnex"]>["annexToAdd"]["annex"]>) {
        const annexChecked = checkAnnex(annex);
        if (annexChecked.type === "TEXT") {
            collectReferencesFromBlocks(annexChecked.annexText.content, allReferences);
        } else {
            annexChecked.annexWithArticles.standaloneArticles.forEach((sa) => collectReferencesFromBlocks(sa.content, allReferences));
            annexChecked.annexWithArticles.chapters.forEach((c) => {
                c.articles.forEach((art) => collectReferencesFromBlocks(art.content, allReferences));
            });
        }
    }

    changes.forEach(collectReferencesFromChange);
    return allReferences;
}

const collectReferencesFromBlocks = (blocks: PrismaContentBlockWithReferences[], list: TextReferenceWithReference[]) => {
    blocks.forEach(b => {
        if (b.references) list.push(...b.references);
    });
}
