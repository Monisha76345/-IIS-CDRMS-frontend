/** Selected office application id for ZC/CAO detail screens (screen-machine style). */
let selectedOfficeAppId: string | null = null;
let caoReturnScreen: 'cao_home' | 'cao_apps' = 'cao_home';

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
