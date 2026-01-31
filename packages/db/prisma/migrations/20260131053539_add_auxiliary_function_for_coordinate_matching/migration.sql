CREATE OR REPLACE FUNCTION coords_match(
    a_init text, a_num int, a_year int, a_annex int, a_chap int, a_art int, a_suf int,
    b_init text, b_num int, b_year int, b_annex int, b_chap int, b_art int, b_suf int
) RETURNS boolean AS $$
BEGIN
    RETURN (
        a_num = b_num AND
        a_year = b_year AND
        UPPER(a_init) = UPPER(b_init) AND
        (a_annex IS NOT DISTINCT FROM b_annex) AND
        (a_chap IS NOT DISTINCT FROM b_chap) AND
        (a_art IS NOT DISTINCT FROM b_art) AND
        (a_suf IS NOT DISTINCT FROM b_suf)
        );
END;
$$ LANGUAGE plpgsql IMMUTABLE;