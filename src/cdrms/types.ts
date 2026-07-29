export type Screen =
  | 'splash'
  | 'login'
  | 'otp'
  | 'permission'
  | 'geo'
  | 'dashboard'
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
