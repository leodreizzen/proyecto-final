-- @param {Json}: $1:data JSONB array of SearchableContent records to insert

INSERT INTO "SearchableContent" (
    "resolutionID",
    "type",
    "chunkNumber",
    "mainText",
    "context",
    "engineVersion",
    "embedding",
    "recitalNumber",
    "considerationNumber",
    "articleNumber",
    "articleSuffix",
    "articleIndexType",
    "annexNumber",
    "annexIndexType",
    "chapterNumber"
)
SELECT
    (x."resolutionID")::uuid,
    (x.type)::"SearchableContentType",
    (x."chunkNumber")::int,
    x."mainText",
    x."context",
    x."engineVersion",
    (x.embedding)::vector,
    (x."recitalNumber")::int,
    (x."considerationNumber")::int,
    (x."articleNumber")::int,
    (x."articleSuffix")::int,
    (x."articleIndexType")::"IndexType",
    (x."annexNumber")::int,
    (x."annexIndexType")::"IndexType",
    (x."chapterNumber")::int
FROM jsonb_to_recordset(($1)::jsonb->'data') AS x(
                                 id text,
                                 "resolutionID" text,
                                 type text,
                                 "chunkNumber" int,
                                 "mainText" text,
                                 "context" text,
                                 "engineVersion" text,
                                 embedding float4[],
                                 "recitalNumber" int,
                                 "considerationNumber" int,
                                 "articleNumber" int,
                                 "articleSuffix" int,
                                 "articleIndexType" text,
                                 "annexNumber" int,
                                 "annexIndexType" text,
                                 "chapterNumber" int
    );