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
};

export type Go = (screen: Screen, opts?: GoOptions) => void;

export type NavTab = 'home' | 'apps' | 'notif' | 'profile';
