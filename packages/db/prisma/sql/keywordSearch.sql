-- @param {String} $1:query The search query string.
-- @param {String} $2:cursorUUID? UUID of the last seen item (for pagination). Can be NULL for the first page.
-- @param {Int} $3:limit Maximum number of results to return.

WITH cursor_ref AS (
    SELECT ts_rank(to_tsvector('es_query', "mainText"), websearch_to_tsquery('es_query', $1::text)) as val
    FROM "SearchableContent"
    WHERE id = $2::uuid
)
SELECT
    id,
    "mainText",
    ts_rank(to_tsvector('es_query', "mainText"), websearch_to_tsquery('es_query', $1::text)) as rank
FROM "SearchableContent"
WHERE
    to_tsvector('es_query', "mainText") @@ websearch_to_tsquery('es_query', $1::text)
  AND (
    $2::uuid IS NULL
        OR
    (SELECT val FROM cursor_ref) IS NULL
        OR
    (
        ts_rank(to_tsvector('es_query', "mainText"), websearch_to_tsquery('es_query', $1::text)) < (SELECT val FROM cursor_ref)
            OR
        (
            ts_rank(to_tsvector('es_query', "mainText"), websearch_to_tsquery('es_query', $1::text)) = (SELECT val FROM cursor_ref)
                AND id > $2::uuid
            )
        )
    )
ORDER BY
    rank DESC,
    id ASC
LIMIT $3::int;