import fs from 'node:fs';

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: node scripts/verify-android-permissions.mjs <AndroidManifest.xml>');
  process.exit(2);
}

const xml = fs.readFileSync(manifestPath, 'utf8');
const permissions = [...xml.matchAll(/<uses-permission[^>]+android:name="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value, index, values) => values.indexOf(value) === index)
  .sort();

const allowed = new Set([
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.ACCESS_WIFI_STATE',
  'android.permission.CAMERA',
  'android.permission.INTERNET'
]);

const unexpected = permissions.filter((permission) => !allowed.has(permission));

console.log('Merged Android permissions:');
for (const permission of permissions) console.log(`- ${permission}`);

if (unexpected.length) {
  console.error('\nUnexpected Android permissions detected:');
  for (const permission of unexpected) console.error(`- ${permission}`);
  process.exit(1);
}
