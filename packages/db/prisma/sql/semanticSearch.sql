-- @param {String} $1:vector Stringified vector to compare against.
-- @param {String} $2:cursorUUID? UUID of the last seen item (for pagination). Can be NULL for the first page.
-- @param {Float} $3:similarityThreshold Minimum similarity score (between 0 and 1) for results to be included.
-- @param {Int} $4:limit Maximum number of results to return.


WITH "CursorData" AS (SELECT (embedding <=> $1::vector) as dist
                      FROM "SearchableContent"
                      WHERE id = $2::uuid)
SELECT id,
       1 - (embedding <=> $1::vector) as similarity
FROM "SearchableContent"
WHERE (embedding <=> $1::vector) < (1 - $3::float)

  AND (
    $2::uuid IS NULL
        OR
    (
        (embedding <=> $1::vector) > (SELECT dist FROM "CursorData")
            OR
        (
            abs((embedding <=> $1::vector) - (SELECT dist FROM "CursorData")) < 0.00001
                AND id > $2::uuid
            )
        )
    )
ORDER BY embedding <=> $1::vector ASC, id ASC
LIMIT $4::int;
