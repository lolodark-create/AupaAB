// Shared icon name union, kept in a .ts file so it can be `import type`-d
// safely from both .astro and .ts callers.

export type IconName =
  | 'menu' | 'x' | 'search' | 'sun' | 'moon'
  | 'home' | 'newspaper' | 'users' | 'bookmark' | 'share' | 'heart' | 'message'
  | 'more' | 'arrowRight' | 'arrowLeft' | 'arrowUp' | 'external' | 'clock'
  | 'chevronDown' | 'chevronUp' | 'chevronRight'
  | 'user' | 'filter' | 'check' | 'flag' | 'plus' | 'settings'
  | 'calendar' | 'mapPin' | 'tv' | 'bell' | 'alertTriangle' | 'tag' | 'logIn' | 'logOut';
