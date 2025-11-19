import {parseFileResolution} from "@/parser/parser";
import path from "node:path";

import {expect, describe, jest, test} from "@jest/globals";
import {Annex, Article, Resolution} from "@/parser/types";

describe("E2E Resolution Parsing", () => {
    jest.retryTimes(0, {logErrorsBeforeRetry: true});
    jest.setTimeout(60 * 4 * 1000);
    test.concurrent("E2E: simple resolution", async () => {
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-1-2012.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 1,
            year: 2012
        })
        expect(parseResData.caseFiles).toEqual(["578/1986"]);
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(2);
        expect(parseResData.articles.length).toBe(2);
        expect(parseResData.annexes.length).toBe(0);
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        })
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        expect(parseResData.articles[0]!.type).toEqual("Normative");
        expect(parseResData.articles[1]!.type).toEqual("Formality");
    });

    test.concurrent("E2E: ModifyArticle", async () => {
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-533-2025.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 533,
            year: 2025
        })
        expect(parseResData.caseFiles).toEqual(["2325/2022"]);
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(5);
        expect(parseResData.articles.length).toBe(3);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        })

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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-500-2016.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 500,
            year: 2016
        })
        expect(parseResData.caseFiles).toEqual(["1230/16"]);
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(4);
        expect(parseResData.articles.length).toBe(3);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.date).toEqual(new Date("2016-09-08T00:00:00Z"));
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        })

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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-268-2025.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 268,
            year: 2025
        })
        expect(parseResData.caseFiles).toEqual(["1502/92", "X-108/19"]);
        expect(parseResData.recitals.length).toBe(3);
        expect(parseResData.considerations.length).toBe(5);
        expect(parseResData.articles.length).toBe(6);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        })
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
                    type: "RepealArticle",
                    targetArticle: {
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-220-2019.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 220,
            year: 2019
        });

        expect(parseResData.caseFiles).toEqual(["X-35/11"]);
        expect(parseResData.recitals.length).toBe(3);
        expect(parseResData.considerations.length).toBe(6);
        expect(parseResData.articles.length).toBe(4);
        expect(parseResData.annexes.length).toBe(1);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        expect(parseResData.date).toEqual(new Date("2019-04-25T00:00:00Z"));
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });
        expect(parseResData.articles[0]!).toMatchObject({
            type: "Normative",
        } satisfies DeepPartial<Article>);
        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "RepealAnnex",
                    targetAnnex: {
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-265-2021.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 265,
            year: 2021
        });
        expect(parseResData.caseFiles).toEqual(["90/17"]);
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(7);
        expect(parseResData.articles.length).toBe(2);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-429-2025.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 429,
            year: 2025
        })
        expect(parseResData.date).toEqual(new Date("2025-07-03T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(2);
        expect(parseResData.articles.length).toBe(3);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");

        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-971-2022.pdf"));
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 971,
            year: 2022
        })
        expect(parseResData.date).toEqual(new Date("2022-12-15T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(3);
        expect(parseResData.considerations.length).toBe(6);
        expect(parseResData.articles.length).toBe(3);
        expect(parseResData.annexes.length).toBe(1);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });
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
        // TODO ALSO WORKS FOR REPEAL RESOLUTION
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-139-2021.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 139,
            year: 2021
        });
        expect(parseResData.recitals.length).toBe(2);
        expect(parseResData.considerations.length).toBe(3);
        expect(parseResData.articles.length).toBe(4);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-214-2018.pdf"));
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 214,
            year: 2018
        });
        expect(parseResData.date).toEqual(new Date("2018-04-19T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(3);
        expect(parseResData.articles.length).toBe(6);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });

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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-582-2017.pdf"));
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 582,
            year: 2017
        });
        expect(parseResData.date).toEqual(new Date("2017-10-05T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(6);
        expect(parseResData.articles.length).toBe(2);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-112-2020.pdf"));
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 112,
            year: 2020
        });
        expect(parseResData.date).toEqual(new Date("2020-04-30T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(5);
        expect(parseResData.considerations.length).toBe(15);
        expect(parseResData.articles.length).toBe(4);
        expect(parseResData.annexes.length).toBe(2);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });
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
        //TODO also works for modify article, and tables
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-751-2023.pdf"));
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 751,
            year: 2023
        });
        expect(parseResData.date).toEqual(new Date("2023-09-22T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(4);
        expect(parseResData.considerations.length).toBe(5);
        expect(parseResData.articles.length).toBe(5);
        expect(parseResData.annexes.length).toBe(1);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });
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
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-233-2020-trimmed.pdf"));
        expect(parseRes.success).toBe(true);
        const resSuccess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSuccess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 233,
            year: 2020
        });
        expect(parseResData.date).toEqual(new Date("2020-06-25T00:00:00Z"));
        expect(parseResData.recitals.length).toBe(4);
        expect(parseResData.considerations.length).toBe(7);
        expect(parseResData.articles.length).toBe(4);
        expect(parseResData.annexes.length).toBe(2);
        expect(parseResData.decisionBy.toLowerCase()).toBe("consejo superior universitario");
        parseResData.articles.forEach(article => {
            expect(article.text).not.toMatch(/^(art[ií]culo)/i)
        });
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

    test.concurrent("E2E: invalid format", async () => {
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "invalid.pdf"));
        expect(parseRes.success).toBe(false);
        const resError = parseRes as typeof parseRes & { success: false };
        expect(resError.error).toMatchObject({
            code: "invalid_format",
        });
    });
    /* TODO:
    - restructure file to use describe and before
    - Assert references
    - change types:
        - RepealChapterAnnex: No examples?
 */
});

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
