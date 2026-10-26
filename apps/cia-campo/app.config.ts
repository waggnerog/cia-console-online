import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CIA Campo',
  slug: 'cia-campo',
  scheme: 'ciacampo',
  version: '1.0.0',
  icon: './assets/icon.png',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'com.usecia.campo',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/monochrome-icon.png',
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
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.DUMP',
      'android.permission.VIBRATE'
    ]
  },
  plugins: [
    [
      'expo-image-picker',
      {
        cameraPermission:
          'O CIA Campo usa a câmera somente quando você registra uma evidência solicitada na visita.',
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
    privacyPolicyUrl: 'https://app.usecia.com/privacidade.html',
    supportUrl: 'https://app.usecia.com/suporte.html'
  }
});
