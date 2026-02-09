-- @param {String} $1:query The search query string.
-- @param {String} $2:cursorUUID? UUID of the last seen item (for pagination). Can be NULL for the first page.
-- @param {Int} $3:limit Maximum number of results to return.

WITH cursor_ref AS (
    SELECT MAX(ts_rank(to_tsvector('es_query', "mainText"), websearch_to_tsquery('es_query', $1::text))) as val
    FROM "SearchableContent"
    WHERE "resolutionID" = $2::uuid
      AND to_tsvector('es_query', "mainText") @@ websearch_to_tsquery('es_query', $1::text)
),
     grouped_resolutions AS (
         SELECT
             "resolutionID",
             MAX(ts_rank(to_tsvector('es_query', "mainText"), websearch_to_tsquery('es_query', $1::text))) as rank
         FROM "SearchableContent"
         WHERE
             to_tsvector('es_query', "mainText") @@ websearch_to_tsquery('es_query', $1::text)
         GROUP BY "resolutionID"
     )
SELECT
    "resolutionID",
    rank
FROM grouped_resolutions
WHERE
    $2::uuid IS NULL
   OR
    (SELECT val FROM cursor_ref) IS NULL
   OR
    (
        rank < (SELECT val FROM cursor_ref)
            OR
        (
            rank = (SELECT val FROM cursor_ref)
                AND "resolutionID" > $2::uuid
            )
        )
ORDER BY
    rank DESC,
    "resolutionID" ASC
LIMIT $3::int;