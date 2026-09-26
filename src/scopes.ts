import type { ZorealCodeResponse } from './types';

/** True when the granted scope string carries every scope named. */
export function hasGrantedAllScopesZoreal(
  response: Pick<ZorealCodeResponse, 'scope'>,
  firstScope: string,
  ...restScopes: string[]
): boolean {
  const granted = new Set((response.scope ?? '').split(/\s+/).filter(Boolean));
  return [firstScope, ...restScopes].every((s) => granted.has(s));
}

export function hasGrantedAnyScopeZoreal(
  response: Pick<ZorealCodeResponse, 'scope'>,
  firstScope: string,
  ...restScopes: string[]
): boolean {
  const granted = new Set((response.scope ?? '').split(/\s+/).filter(Boolean));
  return [firstScope, ...restScopes].some((s) => granted.has(s));
}
