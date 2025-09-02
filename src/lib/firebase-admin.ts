
import admin from 'firebase-admin';

// --- Manual Configuration ---
// This version requires you to provide your Firebase project's service account
// credentials as an environment variable. This is a more robust method for deployed
// environments like Vercel or Netlify.

// How to get your service account key:
// 1. Go to your Firebase project console: https://console.firebase.google.com/
// 2. Click the gear icon > Project settings > Service accounts.
// 3. Click "Generate new private key". A JSON file will be downloaded.
// 4. Open the JSON file, copy its entire contents.
// 5. In your deployment environment (Vercel, Netlify), create an environment
//    variable named `FIREBASE_ADMIN_CREDENTIALS` and paste the JSON content as its value.

// -----------------------------------------------------
// No need to edit anything below this line.
// -----------------------------------------------------

let app: admin.app.App;

if (!admin.apps.length) {
    try {
        const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
        if (!credentialsJson) {
            console.warn("`FIREBASE_ADMIN_CREDENTIALS` environment variable is not set. The proxy service will not function in a deployed environment. For local development, this may be expected.");
        } else {
            const serviceAccount = JSON.parse(credentialsJson);
            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });
        }
    } catch (e: any) {
        console.error("Failed to initialize Firebase Admin SDK. Please ensure the `FIREBASE_ADMIN_CREDENTIALS` environment variable is set correctly in your hosting provider.", e.message);
    }
} else {
    app = admin.app();
}


/**
 * Gets the Firestore database instance for the configured project.
 */
export function getActiveStorageDb() {
  if (!app) {
    throw new Error('Firebase Admin SDK is not initialized. Make sure `FIREBASE_ADMIN_CREDENTIALS` is set in your deployment environment.');
  }
  return admin.firestore(app);
}

/**
 * Returns the ID of the currently active storage project.
 */
export function getActiveProjectId(): string | null {
    if (!app) return null;
    return app.options.projectId || null;
}
