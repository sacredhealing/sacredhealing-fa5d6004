function r(...a){return a.flatMap(e=>[`access_type.eq.${e}`,`and(access_type.eq.program,access_id.eq.${e})`]).join(",")}export{r as a};
