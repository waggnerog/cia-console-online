import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CIA Campo',
  slug: 'cia-campo',
  scheme: 'ciacampo',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'com.usecia.campo',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION'
    ],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE_LOCATION'
    ]
  },
  plugins: [
    [
      'expo-image-picker',
      {
        cameraPermission:
          'O CIA Campo usa a câmera somente quando você registra uma evidência solicitada na visita.',
        photosPermission: false,
        microphonePermission: false
      }
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'O CIA Campo registra sua localização apenas no momento do check-in e do check-out.',
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false
      }
    ]
  ],
  extra: {
    privacyPolicyUrl: 'https://app.usecia.com/#privacidade',
    supportUrl: 'https://app.usecia.com/#suporte'
  }
});
