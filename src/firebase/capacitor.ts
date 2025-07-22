import { registerPlugin } from '@capacitor/core';

import type { FirebaseAuthenticationPlugin } from '@capacitor-firebase/authentication';

const FirebaseAuthentication = registerPlugin<FirebaseAuthenticationPlugin>('FirebaseAuthentication');

export * from '@capacitor-firebase/authentication';
export { FirebaseAuthentication };
