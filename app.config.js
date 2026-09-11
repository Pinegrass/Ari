const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const localGoogleServices = path.join(__dirname, 'google-services.json');
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    (fs.existsSync(localGoogleServices) ? './google-services.json' : undefined);

  return {
    ...config,
    ...(process.env.EXPO_UPDATES_CHANNEL ? {
      updates: {
        ...config.updates,
        requestHeaders: {
          ...config.updates?.requestHeaders,
          'expo-channel-name': process.env.EXPO_UPDATES_CHANNEL,
        },
      },
    } : {}),
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
