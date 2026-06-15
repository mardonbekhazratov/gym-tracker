// Top-level tab destinations (mirrors the items in components/BottomNav.tsx).
export const HOME_PATH = '/';
export const TAB_ROOTS = ['/', '/history', '/progress', '/settings'] as const;

export function isTabRoot(pathname: string): boolean {
  return (TAB_ROOTS as readonly string[]).includes(pathname);
}

// What the Android hardware back button should do for a given route, once any
// open overlay (sheet/dialog) has already been handled separately:
// - 'exit'  the Today tab is the app's home; back leaves the app
// - 'home'  any other top-level tab returns to the Today tab
// - 'back'  a deeper route (e.g. a session detail) navigates back one step
export type BackAction = 'exit' | 'home' | 'back';

export function decideBackAction(pathname: string): BackAction {
  if (pathname === HOME_PATH) return 'exit';
  if (isTabRoot(pathname)) return 'home';
  return 'back';
}
