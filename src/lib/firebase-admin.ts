
import admin from 'firebase-admin';
import { firebaseConfig } from '@/lib/firebase';

// --- Simplified Configuration ---
// The application is now configured to use the Firebase project defined
// in src/lib/firebase.ts. This project will be used for storing API keys
// and as the default database for your client apps.

// No manual setup is required here anymore.

// -----------------------------------------------------
// No need to edit anything below this line.
// -----------------------------------------------------

const projectId = firebaseConfig.projectId;

// Initialize the primary app for database operations.
if (!admin.apps.length) {
  try {
    if (projectId) {
        admin.initializeApp({
            projectId: projectId,
        });
    } else {
        console.warn("Firebase project ID is not set in src/lib/firebase.ts. The proxy service will not function.");
    }
  } catch (e: any) {
    console.error("Failed to initialize Firebase Admin SDK. Please ensure the configuration in src/lib/firebase.ts is correct.", e.message);
  }
}


/**
 * Gets the Firestore database instance for the configured project.
 */
export function getActiveStorageDb() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK is not initialized. Check your configuration in src/lib/firebase.ts');
  }
  return admin.firestore();
}

/**
 * Returns the ID of the currently active storage project.
 */
export function getActiveProjectId(): string | null {
    if (!admin.apps.length || !projectId) return null;
    return projectId;
}
