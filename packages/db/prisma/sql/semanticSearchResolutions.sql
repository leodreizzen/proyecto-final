-- @param {String} $1:vector Stringified vector to compare against.
-- @param {String} $2:cursorUUID? UUID of the last seen item (for pagination). Can be NULL for the first page.
-- @param {Float} $3:similarityThreshold Minimum similarity score (between 0 and 1) for results to be included.
-- @param {Int} $4:limit Maximum number of results to return.

WITH cursor_ref AS (
    SELECT MIN(embedding <=> $1::vector) as dist
    FROM "SearchableContent"
    WHERE "resolutionID" = $2::uuid
      AND (embedding <=> $1::vector) < (1 - $3::float)
),
     grouped_resolutions AS (
         SELECT
             "resolutionID",
             MIN(embedding <=> $1::vector) as dist
         FROM "SearchableContent"
         WHERE (embedding <=> $1::vector) < (1 - $3::float)
         GROUP BY "resolutionID"
     )
SELECT
    "resolutionID",
    1 - dist as similarity
FROM grouped_resolutions
WHERE
    $2::uuid IS NULL
   OR
    (SELECT dist FROM cursor_ref) IS NULL
   OR
    (
        dist > (SELECT dist FROM cursor_ref)
            OR
        (
            abs(dist - (SELECT dist FROM cursor_ref)) < 0.00001
                AND "resolutionID" > $2::uuid
            )
        )
ORDER BY
    dist ASC,
    "resolutionID" ASC
LIMIT $4::int;