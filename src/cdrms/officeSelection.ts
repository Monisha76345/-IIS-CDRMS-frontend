/** Selected office application id for ZC/CAO detail screens (screen-machine style). */
let selectedOfficeAppId: string | null = null;
let caoReturnScreen: 'cao_home' | 'cao_apps' = 'cao_home';
/** Engineer Applications list filter (consumed once on HistoryScreen mount). */
let engineerAppsFilter: string | null = null;
/** Where Applications back should return (e.g. dashboard). */
let engineerAppsReturn: 'dashboard' | null = null;

export function setSelectedOfficeAppId(id: string | null) {
  selectedOfficeAppId = id;
}

export function getSelectedOfficeAppId() {
  return selectedOfficeAppId;
}

export function setCaoReturnScreen(screen: 'cao_home' | 'cao_apps') {
  caoReturnScreen = screen;
}

export function getCaoReturnScreen() {
  return caoReturnScreen;
}

export function setEngineerAppsFilter(filter: string | null) {
  engineerAppsFilter = filter;
}

export function consumeEngineerAppsFilter() {
  const next = engineerAppsFilter;
  engineerAppsFilter = null;
  return next;
}

export function setEngineerAppsReturn(screen: 'dashboard' | null) {
  engineerAppsReturn = screen;
}

export function consumeEngineerAppsReturn() {
  const next = engineerAppsReturn;
  engineerAppsReturn = null;
  return next;
}

/** Header theme icon → Profile “App theme” section. */
let focusProfileTheme = false;

export function requestFocusProfileTheme() {
  focusProfileTheme = true;
}

export function consumeFocusProfileTheme() {
  const next = focusProfileTheme;
  focusProfileTheme = false;
  return next;
}
