CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION resolution_search_id(initial text, number integer, year integer)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT UPPER(initial || '-' || number::text || '-' || year::text);
$$;

CREATE OR REPLACE VIEW "v_ResolutionSearch" AS
SELECT 
    id,
    resolution_search_id(initial, number, year) as search_id
FROM "Resolution";

CREATE INDEX "Resolution_search_id_idx"
ON "Resolution" 
USING GIN (resolution_search_id(initial, number, year) gin_trgm_ops);
