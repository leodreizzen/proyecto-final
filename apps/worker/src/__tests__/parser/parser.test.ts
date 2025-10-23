import {parseFileResolution} from "@/parser/parser";
import path from "node:path";

import {expect, describe, jest, test} from "@jest/globals";
import {Annex, Article, Resolution} from "@/parser/types";

describe("E2E Resolution Parsing", () => {
    jest.retryTimes(2, {logErrorsBeforeRetry: true});
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
                        referenceType: "Article",
                        number: 2,
                        resolutionId: {
                            initial: "CSU",
                            number: 1057,
                            year: 2023
                        },
                    }
                }
            ]
        });

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: "ModifyArticle",
                    targetArticle: {
                        referenceType: "Article",
                        number: 3,
                        resolutionId: {
                            initial: "CSU",
                            number: 1057,
                            year: 2023
                        },
                    }
                }
            ]
        })
        expect(parseResData.articles[2]!).toMatchObject({
            type: "Formality",
        });
    });

    test.concurrent("E2E: Replace Article", async () => {
        const parseRes = await parseFileResolution(path.join(__dirname, "test_files", "CSU_RES-326-2007.pdf"));
        expect(parseRes.success).toBe(true);
        const resSucess = parseRes as typeof parseRes & { success: true };
        const parseResData = resSucess.data;
        expect(parseResData.id).toEqual({
            initial: "CSU",
            number: 326,
            year: 2007
        })
        expect(parseResData.caseFiles).toEqual(["54/00"]);
        expect(parseResData.recitals.length).toBe(1);
        expect(parseResData.considerations.length).toBe(5);
        expect(parseResData.articles.length).toBe(2);
        expect(parseResData.annexes.length).toBe(0);
        expect(parseResData.date).toEqual(new Date("2007-06-26T00:00:00Z"));
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
                        referenceType: "Article",
                        number: 26,
                        resolutionId: {
                            initial: "CSU",
                            number: 245,
                            year: 1993
                        },
                    },
                }
            ]
        } satisfies DeepPartial<Article>);

        expect(parseResData.articles[1]!).toMatchObject({
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
                        referenceType: "Article",
                        number: 1,
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
                        referenceType: "Article",
                        number: 2,
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
                        referenceType: "Article",
                        number: 4,
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
                        number: 1,
                    },
                    newContent: {
                        type: "Inline",
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
        });
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
                        number: 2,
                    }
                }
            ]
        });
        expect(parseResData.annexes[0]!.type).toBe("Regulation");
        const annexRegulation = parseResData.annexes[0] as Extract<Resolution["annexes"][number], { type: "Regulation" }>;
        expect(annexRegulation.articles).toHaveLength(2);
        expect(annexRegulation.chapters).toHaveLength(0);

        expect(annexRegulation.articles[0]!.tables).toHaveLength(1);
        const table = annexRegulation.articles[0]!.tables[0]!;
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
        });

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Formality"
        });
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
                        referenceType: "Article",
                        number: 2,
                        resolutionId: {
                            initial: "CSU",
                            number: 310,
                            year: 2025
                        }
                    }
                }
            ]
        });

        expect(parseResData.articles[1]!).toMatchObject({
            type: "Modifier",
            changes: [
                {
                    type: 'ModifyArticle',
                    targetArticle: {
                        referenceType: 'Article',
                        annex: {
                            referenceType: 'Annex',
                            resolutionId: {initial: 'CSU', number: 310, year: 2025},
                            number: 1
                        },
                        number: 9,
                    }
                }
            ]
        });
    });

    test.concurrent("E2E: modify annex & create document", async () => {
        //TODO this can also be used for modify annex article
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
                        number: 1,
                    }
                }
            ]
        });

        expect(parseResData.articles[1]!).toMatchObject({
            type: "CreateDocument",
            annexToApprove: {
                referenceType: 'Annex',
                resolutionId: {initial: 'CSU', number: 971, year: 2022},
                number: 1
            },
        });
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
                    targetResolution: {
                        referenceType: 'Resolution',
                        resolutionId: {initial: 'CSU', number: 83, year: 2021}
                    },
                    targetNumber: 4,
                    targetSuffix: 'bis',
                }
            ]
        } satisfies DeepPartial<Article>)
    });


    test.concurrent("E2E: Add Article to Annex", async () => {
        //TODO ALSO WORKS FOR REPLACE ARTICLE IN ANNEX
        //TODO ALSO WORKS FOR ADVANCED CHANGE
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
                        number: 1,
                    },
                    targetNumber: 2,
                    targetSuffix: "bis",
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
                            number: 1
                        },
                        number: 4
                    },
                    targetNumber: null,
                    targetSuffix: null,
                }
            ],
        });
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
                        number: 1
                    },
                    target: {
                        referenceType: 'Annex',
                        resolutionId: {initial: 'CSU', number: 511, year: 2010},
                        number: 1
                    },
                    targetNumber: 1
                }
            ]
        });
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
                        number: 1
                    },
                    newContent: {
                        type: 'Reference',
                        reference: {
                            referenceType: 'Annex',
                            resolutionId: {initial: 'CSU', number: 751, year: 2023},
                            number: 1
                        }
                    }
                }
            ],
        });
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

    test.concurrent("E2E: modfications annex", async ()=> {
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
                        number: 1
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
                        number: 2
                    },
                }
            ],
        } satisfies DeepPartial<Article>);

        const firstAnnex = parseResData.annexes[0]!;
        expect(firstAnnex.type).toBe("Regulation" satisfies Annex["type"]);
        const firstAnnexRegulation = firstAnnex as Extract<typeof firstAnnex, { type: "Regulation" }>;
        expect(firstAnnexRegulation.articles).toHaveLength(2);

        const secondAnnex = parseResData.annexes[1]!;
        expect(secondAnnex.type).toBe("Regulation" satisfies Annex["type"]);
        const secondAnnexRegulation = secondAnnex as Extract<typeof secondAnnex, { type: "Regulation" }>;
        expect(secondAnnexRegulation.articles).toHaveLength(2);
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
    - Check why CSU_971_2022 frequently fails
    - restructure file to use describe and before
    - Assert references
    - change types:
        - RepealChapterAnnex: No examples?
 */
});

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
