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
  | 'cao_detail'
  | 'project'
  | 'bandi'
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
  | 'details'
  | 'returned'
  | 'profile'
  | 'error';

export type Go = (screen: Screen) => void;

export type NavTab = 'home' | 'apps' | 'notif' | 'profile';
