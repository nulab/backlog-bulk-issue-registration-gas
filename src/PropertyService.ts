import PropertiesService = GoogleAppsScript.Properties.PropertiesService;

export const getUserProperty = (key: String) => {
  return PropertiesService.getUserProperties().getProperty('bti.' + key);
};
