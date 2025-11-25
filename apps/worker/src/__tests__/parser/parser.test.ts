import {parseFileResolution} from "@/parser/parser";
import path from "node:path";

import {expect, describe, jest, test} from "@jest/globals";
import {Annex, Article, Resolution} from "@/parser/types";
import {ResolutionID} from "@/parser/schemas/common";


describe("E2E Resolution Parsing", () => {
    function structureChecks(resolution: Resolution, expected: {
        id: ResolutionID,
        numRecitals: number,
        numConsiderations: number,
        numArticles: number,
        numAnnexes: number,
        caseFiles?: string[],
        decisionBy: string,
    }) {
        expect(resolution.id).toEqual(expected.id);
        expect(resolution.recitals.length).toBe(expected.numRecitals);
        expect(resolution.considerations.length).toBe(expected.numConsiderations);
        expect(resolution.articles.length).toBe(expected.numArticles);
        expect(resolution.annexes.length).toBe(expected.numAnnexes);
        if (expected.caseFiles !== undefined)
            expect(resolution.caseFiles).toEqual(expect.arrayContaining(expected.caseFiles));
        expect(resolution.decisionBy.toLowerCase()).toBe(expected.decisionBy.toLowerCase());

        resolution.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        })

    }

    async function parseTestFile(fileName: string) {
        return parseFileResolution(path.join(__dirname, "test_files", fileName));
    }

    jest.retryTimes(0, {logErrorsBeforeRetry: true});
    jest.setTimeout(60 * 15 * 1000);

    test.concurrent("E2E: simple resolution", async () => {
        const parseRes = await parseTestFile("CSU_RES-1-2012.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 1,
                year: 2012
            },
            caseFiles: ["578/1986"],
            numRecitals: 1,
            numConsiderations: 2,
            numArticles: 2,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.articles[0]!.type).toEqual("Normative");
        expect(parseResData.articles[1]!.type).toEqual("Formality");
    });

    test.concurrent("E2E: ModifyArticle", async () => {
        const parseRes = await parseTestFile("CSU_RES-533-2025.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 533,
                year: 2025
            },
            caseFiles: ["2325/2022"],
            numRecitals: 1,
            numConsiderations: 5,
            numArticles: 3,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 2,
                        resolutionId: {
                            initial: "CSU",
                            number: 1057,
                            year: 2023
                        },
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 3,
                        resolutionId: {
                            initial: "CSU",
                            number: 1057,
                            year: 2023
                        },
                    }
                }
            ]
        } satisfies DeepPartial<Article>)
        expect(parseResData.articles[2]!).toMatchObject({
            type: "Formality",
        });
    });

    test.concurrent("E2E: Replace Article", async () => {
        const parseRes = await parseTestFile("CSU_RES-500-2016.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 500,
                year: 2016
            },
            caseFiles: ["1230/16"],
            numRecitals: 1,
            numConsiderations: 4,
            numArticles: 3,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2016-09-08T00:00:00Z"));

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ReplaceArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 1,
                        resolutionId: {
                            initial: "CSU",
                            number: 358,
                            year: 2016
                        },
                    },
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ReplaceArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 3,
                        resolutionId: {
                            initial: "CSU",
                            number: 358,
                            year: 2016
                        },
                    },
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[2]!).toMatchObject({
            type: "Formality"
        });
    })

    test.concurrent("E2E: Repeal article & replace annex inline", async () => {
        const parseRes = await parseTestFile("CSU_RES-268-2025.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;


        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 268,
                year: 2025
            },
            caseFiles: ["1502/92", "X-108/19"],
            numRecitals: 3,
            numConsiderations: 5,
            numArticles: 6,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 1,
                        resolutionId: {
                            initial: "CSU",
                            number: 94,
                            year: 2025,
                        }
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "Repeal",
                    target: {
                        referenceType: "NormalArticle",
                        articleNumber: 2,
                        resolutionId: {
                            initial: "CSU",
                            number: 94,
                            year: 2025,
                        }
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[2]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 4,
                        resolutionId: {
                            initial: "CSU",
                            number: 478,
                            year: 2024,
                        }
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[3]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ReplaceAnnex",
                    targetAnnex: {
                        referenceType: "Annex",
                        resolutionId: {
                            initial: "CSU",
                            number: 478,
                            year: 2024,
                        },
                        annexNumber: 1,
                    },
                    newContent: {
                        contentType: "Inline",
                        content: {
                            type: "TextOrTables",
                        }
                    }
                }
            ]
        } satisfies DeepPartial<Article>);
    })

    test.concurrent("E2E: repeal annex", async () => {
        const parseRes = await parseTestFile("CSU_RES-220-2019.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 220,
                year: 2019
            },
            caseFiles: ["X-35/11"],
            numRecitals: 3,
            numConsiderations: 6,
            numArticles: 4,
            numAnnexes: 1,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2019-04-25T00:00:00Z"));

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Normative",
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "Repeal",
                    target: {
                        referenceType: "Annex",
                        resolutionId: {
                            initial: "CSU",
                            number: 843,
                            year: 2005,
                        },
                        annexNumber: 2,
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.annexes[0]!.type).toBe("WithArticles");
        const annexWithArticles = parseResData.annexes[0] as Extract<Resolution["annexes"][number], {
            type: "WithArticles"
        }>;
        expect(annexWithArticles.articles).toHaveLength(2);
        expect(annexWithArticles.chapters).toHaveLength(0);

        expect(annexWithArticles.articles[0]!.tables).toHaveLength(1);
        const table = annexWithArticles.articles[0]!.tables[0]!;
        expect(table.number).toBe(1);
        expect(table.rows).toHaveLength(9);
        table.rows.forEach(row => {
            expect(row.cells).toHaveLength(3);
        });
    });


    test.concurrent("E2E: Ratify ad referendum", async () => {
        const parseRes = await parseTestFile("CSU_RES-265-2021.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;


        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 265,
                year: 2021
            },
            caseFiles: ["90/17"],
            numRecitals: 1,
            numConsiderations: 7,
            numArticles: 2,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "RatifyAdReferendum",
                    resolutionToRatify: {
                        initial: "R",
                        number: 281,
                        year: 2021
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Formality"
        } satisfies DeepPartial<Article>);
    })

    test.concurrent("E2E: modify article, both normal and annex", async () => {
        const parseRes = await parseTestFile("CSU_RES-429-2025.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 429,
                year: 2025
            },
            caseFiles: ["X-46/11"],
            numRecitals: 1,
            numConsiderations: 2,
            numArticles: 3,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2025-07-03T00:00:00Z"));

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyArticle",
                    targetArticle: {
                        referenceType: "NormalArticle",
                        articleNumber: 2,
                        resolutionId: {
                            initial: "CSU",
                            number: 310,
                            year: 2025
                        }
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: 'ModifyArticle',
                    targetArticle: {
                        referenceType: 'AnnexArticle',
                        annex: {
                            referenceType: 'Annex',
                            resolutionId: {initial: 'CSU', number: 310, year: 2025},
                            annexNumber: 1
                        },
                        articleNumber: 9,
                    }
                }
            ]
        } satisfies DeepPartial<Article>);
    });

    test.concurrent("E2E: modify annex & create document", async () => {
        const parseRes = await parseTestFile("CSU_RES-971-2022.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;


        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 971,
                year: 2022
            },
            caseFiles: ["X-22/95"],
            numRecitals: 3,
            numConsiderations: 6,
            numArticles: 3,
            numAnnexes: 1,
            decisionBy: "consejo superior universitario",
        });


        expect(parseResData.date).toEqual(new Date("2022-12-15T00:00:00Z"));

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyTextAnnex",
                    targetAnnex: {
                        referenceType: "Annex",
                        resolutionId: {
                            initial: "CSU",
                            number: 584,
                            year: 2006
                        },
                        annexNumber: 1,
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "CreateDocument",
            annexToApprove: {
                referenceType: 'Annex',
                resolutionId: {initial: 'CSU', number: 971, year: 2022},
                annexNumber: 1
            },
        } satisfies DeepPartial<Article>);
    });

    test.concurrent("E2E: Add Article To Resolution", async () => {
        const parseRes = await parseTestFile("CSU_RES-139-2021.pdf");
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 139,
                year: 2021
            },
            caseFiles: ["489/20"],
            numRecitals: 2,
            numConsiderations: 3,
            numArticles: 4,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "AddArticleToResolution",
                    targetResolution: {initial: 'CSU', number: 83, year: 2021},
                    newArticleNumber: 4,
                    newArticleSuffix: 'bis',
                }
            ]
        } satisfies DeepPartial<Article>)
    });


    test.concurrent("E2E: Add Article to Annex", async () => {
        const parseRes = await parseTestFile("CSU_RES-214-2018.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 214,
                year: 2018
            },
            caseFiles: ["1123/09"],
            numRecitals: 1,
            numConsiderations: 3,
            numArticles: 6,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2018-04-19T00:00:00Z"));

        expect(parseResData.articles[0]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ReplaceArticle",
                    targetArticle: {
                        referenceType: "AnnexArticle",
                        annex: {
                            referenceType: "Annex",
                            resolutionId: {initial: "CSU", number: 311, year: 2015},
                        },
                        articleNumber: 2
                    }
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "AddArticleToAnnex",
                    target: {
                        referenceType: "Annex",
                        resolutionId: {
                            initial: "CSU",
                            number: 311,
                            year: 2015
                        },
                        annexNumber: 1,
                    },
                    newArticleNumber: 2,
                    newArticleSuffix: "bis",
                }
            ]
        } satisfies DeepPartial<Article>)

        expect(parseResData.articles[4]).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "AdvancedChange",
                }
            ]
        } satisfies DeepPartial<Article>);
    });

    test.concurrent("E2E: Add article to chapter", async () => {
        const parseRes = await parseTestFile("CSU_RES-582-2017.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 582,
                year: 2017
            },
            caseFiles: ["993/11"],
            numRecitals: 1,
            numConsiderations: 6,
            numArticles: 2,
            numAnnexes: 0,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2017-10-05T00:00:00Z"));

        expect(parseResData.articles[0]!).toMatchObject({
            type: 'Modifier',
            changes: [
                {
                    type: 'AddArticleToAnnex',
                    target: {
                        referenceType: 'Chapter',
                        annex: {
                            referenceType: 'Annex',
                            resolutionId: {initial: 'CSU', number: 406, year: 2012},
                            annexNumber: 1
                        },
                        chapterNumber: 4
                    },
                    newArticleNumber: null,
                    newArticleSuffix: null,
                }
            ],
        } satisfies DeepPartial<Article>);
    });

    test.concurrent("E2E: add annex to annex", async () => {
        const parseRes = await parseTestFile("CSU_RES-112-2020.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 112,
                year: 2020
            },
            caseFiles: ["1132/1986"],
            numRecitals: 5,
            numConsiderations: 15,
            numArticles: 4,
            numAnnexes: 2,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2020-04-30T00:00:00Z"));

        expect(parseResData.articles[1]!).toMatchObject({
            type: 'Modifier',
            changes: [
                {
                    type: 'AddAnnexToAnnex',
                    annexToAdd: {
                        referenceType: 'Annex',
                        resolutionId: {initial: 'CSU', number: 112, year: 2020},
                        annexNumber: 1
                    },
                    target: {
                        referenceType: 'Annex',
                        resolutionId: {initial: 'CSU', number: 511, year: 2010},
                        annexNumber: 1
                    },
                    newAnnexNumber: 1
                }
            ]
        } satisfies DeepPartial<Article>);
    })

    test.concurrent("E2E: Replace annex with reference & tables", async () => {
        const parseRes = await parseTestFile("CSU_RES-751-2023.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 751,
                year: 2023
            },
            caseFiles: ["2648/14"],
            numRecitals: 4,
            numConsiderations: 5,
            numArticles: 5,
            numAnnexes: 1,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2023-09-22T00:00:00Z"));
        expect(parseResData.articles[1]!).toMatchObject({
            type: 'Modifier',
            changes: [
                {
                    type: 'ReplaceAnnex',
                    targetAnnex: {
                        referenceType: 'Annex',
                        resolutionId: {initial: 'CSU', number: 640, year: 2023},
                        annexNumber: 1
                    },
                    newContent: {
                        contentType: 'Reference',
                        reference: {
                            referenceType: 'Annex',
                            resolutionId: {initial: 'CSU', number: 751, year: 2023},
                            annexNumber: 1
                        }
                    }
                }
            ],
        } satisfies DeepPartial<Article>);
        expect(parseResData.annexes).toHaveLength(1);
        const annex = parseResData.annexes[0]!;
        expect(annex.type).toBe("TextOrTables");
        const annexTextOrTables = annex as Extract<typeof annex, { type: "TextOrTables" }>;
        expect(annexTextOrTables.tables).toHaveLength(1);
        const table = annexTextOrTables.tables[0]!;
        expect(table.number).toBe(1);
        expect(table.rows).toHaveLength(5);
        expect(table.rows[0]!.header).toBe(true);
    })

    test.concurrent("E2E: modfications annex", async () => {
        const parseRes = await parseTestFile("CSU_RES-233-2020-trimmed.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;

        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 233,
                year: 2020
            },
            numRecitals: 4,
            numConsiderations: 7,
            numArticles: 4,
            numAnnexes: 2,
            decisionBy: "consejo superior universitario",
        });

        expect(parseResData.date).toEqual(new Date("2020-06-25T00:00:00Z"));
        expect(parseResData.articles[0]!).toMatchObject({
            type: 'Modifier',
            changes: [
                {
                    type: 'ApplyModificationsAnnex',
                    annexToApply: {
                        referenceType: 'Annex',
                        resolutionId: {initial: 'CSU', number: 233, year: 2020},
                        annexNumber: 1
                    },
                }
            ],
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
            type: 'Modifier',
            changes: [
                {
                    type: 'ApplyModificationsAnnex',
                    annexToApply: {
                        referenceType: 'Annex',
                        resolutionId: {initial: 'CSU', number: 233, year: 2020},
                        annexNumber: 2
                    },
                }
            ],
        } satisfies DeepPartial<Article>);

        const firstAnnex = parseResData.annexes[0]!;
        expect(firstAnnex.type).toBe("WithArticles" satisfies Annex["type"]);
        const firstAnnexWithArticles = firstAnnex as Extract<typeof firstAnnex, { type: "WithArticles" }>;
        expect(firstAnnexWithArticles.articles).toHaveLength(2);

        const secondAnnex = parseResData.annexes[1]!;
        expect(secondAnnex.type).toBe("WithArticles" satisfies Annex["type"]);
        const secondAnnexWithArticles = secondAnnex as Extract<typeof secondAnnex, { type: "WithArticles" }>;
        expect(secondAnnexWithArticles.articles).toHaveLength(2);
    });

    test.concurrent("E2E: Resolution with chapters", async () => {
        const parseRes = await parseTestFile("CSU_RES-550-2019.pdf");
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        structureChecks(parseResData, {
            id: {
                initial: "CSU",
                number: 550,
                year: 2019
            },
            numRecitals: 2,
            numConsiderations: 3,
            numArticles: 2,
            numAnnexes: 1,
            decisionBy: "consejo superior universitario",
        });

        const firstAnnex = parseResData.annexes[0]!;
        expect(firstAnnex.type).toBe("WithArticles" satisfies Annex["type"]);
        const firstAnnexWithArticles = firstAnnex as Extract<typeof firstAnnex, { type: "WithArticles" }>;
        expect(firstAnnexWithArticles.chapters).toHaveLength(5);
        expect(firstAnnexWithArticles.chapters[0]!.articles).toHaveLength(1);
        expect(firstAnnexWithArticles.chapters[1]!.articles).toHaveLength(4);
        expect(firstAnnexWithArticles.chapters[2]!.articles).toHaveLength(3);
        expect(firstAnnexWithArticles.chapters[3]!.articles).toHaveLength(3);
        expect(firstAnnexWithArticles.chapters[4]!.articles).toHaveLength(2);
        expect(firstAnnexWithArticles.articles).toHaveLength(0);
        firstAnnexWithArticles.chapters.forEach(chapter => {
            chapter.articles.forEach(article => {
                expect(article.text).not.toMatch(/^(art[ií]culo)/i);
                expect(article.type).toEqual("Normative");
            });
        });
    })

    test.concurrent("E2E: invalid format", async () => {
        const parseRes = await parseTestFile("invalid.pdf");
        expect(parseRes.success).toBe(false);
        const resError = parseRes as typeof parseRes & { success: false };
        expect(resError.error).toMatchObject({
            code: "invalid_format",
        });
    });
});

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
