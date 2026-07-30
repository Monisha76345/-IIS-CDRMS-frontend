/** Selected office application id for ZC/CAO detail screens (screen-machine style). */
let selectedOfficeAppId: string | null = null;

export function setSelectedOfficeAppId(id: string | null) {
  selectedOfficeAppId = id;
}

export function getSelectedOfficeAppId() {
  return selectedOfficeAppId;
}
