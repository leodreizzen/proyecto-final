CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;


CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TEXT SEARCH CONFIGURATION es_query (COPY = spanish);

ALTER TEXT SEARCH CONFIGURATION es_query
    ALTER MAPPING FOR hword, hword_part, word
        WITH unaccent, spanish_stem;

CREATE INDEX idx_google_search
    ON "SearchableContent"
        USING GIN (to_tsvector('es_query', "mainText"));