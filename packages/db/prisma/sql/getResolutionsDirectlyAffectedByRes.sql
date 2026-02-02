-- @param {String} $1:sourceResolutionId UUID of the source Resolution

SELECT DISTINCT target_res.id AS affected_resolution_id
FROM "Resolution" source_res
         JOIN "v_ArticleContext" article_ctx
              ON article_ctx."rootResolutionId" = source_res.id
         JOIN "ArticleModifier" art_mod
              ON art_mod.id = article_ctx.id
         JOIN "Change" ch
              ON ch."articleModifierId" = art_mod.id
         JOIN "v_ImpactMap" impact_map
              ON impact_map."change_id" = ch.id
         JOIN "Resolution" target_res
              ON UPPER(impact_map.res_init) = UPPER(target_res.initial)
                  AND impact_map.res_num = target_res.number
                  AND impact_map.res_year = target_res.year
WHERE source_res.id = $1::uuid;



