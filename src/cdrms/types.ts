export type Screen =
  | 'splash'
  | 'login'
  | 'otp'
  | 'permission'
  | 'geo'
  | 'dashboard'
  | 'zc_home'
  | 'zc_create'
  | 'zc_detail'
  | 'cao_home'
  | 'cao_apps'
  | 'cao_detail'
  | 'cao_approve'
  | 'project'
  | 'bandi'
  | 'dimensions'
  | 'directions'
  | 'surroundings'
  | 'photos'
  | 'video'
  | 'draft'
  | 'validate'
  | 'review'
  | 'success'
  | 'notifications'
  | 'history'
  | 'engineer_detail'
  | 'details'
  | 'returned'
  | 'profile'
  | 'error';

export type GoOptions = {
  /** Don't push the current screen onto the back stack (use for back / leave). */
  replace?: boolean;
  /** When navigating to `error`, optional kind/status for ErrorScreen. */
  errorKind?: import('@/src/errors').ErrorKind;
  errorStatus?: number | null;
  onRetry?: () => void;
  /** Keep bottom nav on error screen when authenticated. */
  errorVariant?: 'global' | 'shell';
};

export type Go = (screen: Screen, opts?: GoOptions) => void;

export type ErrorNavState = {
  kind: import('@/src/errors').ErrorKind;
  status: number | null;
  onRetry?: () => void;
  variant: 'global' | 'shell';
};

export type NavTab = 'home' | 'apps' | 'notif' | 'profile';
