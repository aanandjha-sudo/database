
'use server';

import admin from 'firebase-admin';

// --- Multi-Project Configuration ---
// This version supports multiple Firebase projects. It uses one project
// (the "management" project) to store the credentials for all other "storage" projects.

// How to set up:
// 1. Choose one Firebase project to be your "management" project. This is where the
//    proxy's own data (like other projects' credentials) will be stored.
// 2. Get the service account key for this MANAGEMENT project.
// 3. In your deployment environment (Vercel, Netlify), create an environment
//    variable named `FIREBASE_MANAGEMENT_CREDENTIALS` and paste the JSON content as its value.
// 4. The service account keys for all other "storage" projects will be added
//    via the dashboard UI, NOT as environment variables.

const MANAGEMENT_PROJECT_COLLECTION = '_proxy_projects';
let managementApp: admin.app.App | null = null;
const storageApps = new Map<string, admin.app.App>();

function initializeManagementApp() {
  if (managementApp) return;

  if (admin.apps.some(app => app?.name === 'management')) {
    managementApp = admin.app('management');
    return;
  }

  try {
    const credentialsJson = process.env.FIREBASE_MANAGEMENT_CREDENTIALS;
    if (!credentialsJson) {
      // Don't throw an error here. Instead, log it and let the app run.
      // The UI will handle showing a friendly error to the user.
      console.warn('`FIREBASE_MANAGEMENT_CREDENTIALS` environment variable is not set. Management features will be disabled.');
      managementApp = null;
      return;
    }
    const serviceAccount = JSON.parse(credentialsJson);
    managementApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    }, 'management');
  } catch (e: any) {
    console.error("Failed to initialize Firebase Management App:", e.message);
    // Also don't throw here.
    managementApp = null;
  }
}

initializeManagementApp();

/**
 * Gets the Firestore instance for the management database.
 */
export async function getManagementDb() {
  if (!managementApp) {
    throw new Error('Management App is not initialized. Please set FIREBASE_MANAGEMENT_CREDENTIALS.');
  }
  return admin.firestore(managementApp);
}

/**
 * Gets the Firestore instance for a specific storage project.
 * @param projectId The project ID to get the database for.
 */
export async function getStorageDb(projectId: string): Promise<admin.firestore.Firestore> {
  if (storageApps.has(projectId)) {
    // Type assertion is safe because we check `has` above.
    return admin.firestore(storageApps.get(projectId)!);
  }

  try {
    const db = await getManagementDb();
    const doc = await db.collection(MANAGEMENT_PROJECT_COLLECTION).doc(projectId).get();
    
    if (!doc.exists) {
      throw new Error(`Project configuration for '${projectId}' not found.`);
    }

    const projectData = doc.data();
    if (!projectData || !projectData.credentials) {
       throw new Error(`Credentials for project '${projectId}' are missing or invalid.`);
    }
    
    const credentials = JSON.parse(projectData.credentials);

    // Check if an app with this name (project ID) already exists
    const existingApp = admin.apps.find(app => app?.name === projectId);
    if (existingApp) {
      storageApps.set(projectId, existingApp);
      return admin.firestore(existingApp);
    }

    const newApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId: credentials.project_id,
    }, projectId);

    storageApps.set(projectId, newApp);
    return admin.firestore(newApp);

  } catch (error: any) {
    console.error(`Failed to initialize storage app for project ${projectId}:`, error);
    throw new Error(`Could not connect to database for project '${projectId}'.`);
  }
}

/**
 * Returns the ID of the management project.
 */
export async function getManagementProjectId(): Promise<string | null> {
    if (!managementApp) return null;
    return managementApp.options.projectId || null;
}
