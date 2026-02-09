import type { NavigateFunction } from 'react-router-dom';

let navigator: NavigateFunction | null = null;

export function setNavigator(n: NavigateFunction) {
  navigator = n;
}

export function navigateTo(path: string, options?: { state?: any; replace?: boolean }) {
  if (!navigator) return;
  navigator(path, options);
}
