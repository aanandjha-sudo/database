
import admin from 'firebase-admin';

// --- STEP 1: CONFIGURE YOUR DATABASE PROJECT ---
// To connect your Firebase project, paste the contents of your
// service account JSON file here.
//
// How to get your service account file:
// 1. Go to your Firebase project settings.
// 2. Go to the "Service accounts" tab.
// 3. Click "Generate new private key".
//
// After pasting, your code should look like this:
// const serviceAccount = { "type": "service_account", "project_id": "...", ... };
// -----------------------------------------------------

const serviceAccount = {
  // PASTE YOUR FIREBASE SERVICE ACCOUNT JSON HERE
  // If this is empty, the service will not work.
  // Example: "type": "service_account", "project_id": "my-cool-project", ...
};


// -----------------------------------------------------
// No need to edit anything below this line.
// -----------------------------------------------------

const MANAGEMENT_PROJECT_ID = (serviceAccount as any).project_id || 'management_db';
const KEYS_COLLECTION = '_proxy_api_keys';

// Initialize the primary app for database operations.
if (!admin.apps.length) {
  try {
    if (serviceAccount && (serviceAccount as any).project_id) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${(serviceAccount as any).project_id}.firebaseio.com`
        });
    } else {
        console.warn("Service account credentials are not set in src/lib/firebase-admin.ts. The proxy service will not function.");
    }
  } catch (e: any) {
    console.error("Failed to initialize Firebase Admin SDK. Please ensure the service account JSON in src/lib/firebase-admin.ts is correct.", e.message);
  }
}


/**
 * Gets the Firestore database instance for the configured project.
 */
export function getActiveStorageDb() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK is not initialized. Check your configuration in src/lib/firebase-admin.ts');
  }
  return admin.firestore();
}

/**
 * Returns the ID of the currently active storage project.
 */
export function getActiveProjectId(): string | null {
    if (!admin.apps.length || !serviceAccount || !(serviceAccount as any).project_id) return null;
    return (serviceAccount as any).project_id;
}
