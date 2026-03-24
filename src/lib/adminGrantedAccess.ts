/**
 * PostgREST `.or()` filter: extended grant types are often stored as
 * access_type = 'program' and access_id = <feature key> (DB constraint),
 * while legacy rows may use access_type = <feature key> directly.
 */
export function adminGrantedFeatureOr(...featureKeys: string[]): string {
  return featureKeys
    .flatMap((k) => [`access_type.eq.${k}`, `and(access_type.eq.program,access_id.eq.${k})`])
    .join(',');
}
