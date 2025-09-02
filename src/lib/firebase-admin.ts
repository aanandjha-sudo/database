import admin from 'firebase-admin';

// Define the structure for a storage project's configuration
interface StorageProjectConfig {
  projectId: string;
  creds: admin.ServiceAccount;
}

// --- Configuration ---\
// This array holds the configurations for all your storage projects.
const storageProjects: StorageProjectConfig[] = [];

// This function dynamically finds and loads all STORAGE_PROJECT variables from the environment.
function loadStorageProjectsFromEnv() {
  // Prevent multiple loads
  if (storageProjects.length > 0) return;

  let i = 1;
  while (process.env[`STORAGE_PROJECT_${i}_ID`] && process.env[`STORAGE_PROJECT_${i}_CREDS_BASE64`]) {
    try {
      const credsBase64 = process.env[`STORAGE_PROJECT_${i}_CREDS_BASE64`]!;
      if (credsBase64.startsWith('ey')) {
          const credsJson = Buffer.from(credsBase64, 'base64').toString('utf-8');
          const serviceAccount = JSON.parse(credsJson);

          storageProjects.push({
            projectId: process.env[`STORAGE_PROJECT_${i}_ID`]!,
            creds: serviceAccount,
          });
      } else {
        console.error(`Error parsing credentials for STORAGE_PROJECT_${i}: value is not a valid Base64 string.`);
      }
    } catch (e) {
      console.error(`Error parsing credentials for STORAGE_PROJECT_${i}. Please check .env.local`, e);
    }
    i++;
  }

  if (storageProjects.length === 0) {
    console.warn('WARNING: No storage projects loaded. The proxy service will not function.');
  }
}

// --- State Management ---
// This variable holds the index of the currently active storage project.
let activeProjectIndex = 0;

// --- App Initialization ---

// Initialize the main app instance for verifying auth tokens from the frontend.
if (!admin.apps.some(app => app?.name === 'PRIMARY_AUTH')) {
    if (process.env.MAIN_APP_PROJECT_ID) {
        admin.initializeApp({
            projectId: process.env.MAIN_APP_PROJECT_ID,
        }, 'PRIMARY_AUTH');
    } else {
        console.warn('WARNING: MAIN_APP_PROJECT_ID is not set. Auth verification will fail.');
    }
}

// Load projects from environment on first import
loadStorageProjectsFromEnv();

// Initialize the first storage project app instance.
function initializeActiveStorageApp() {
  if (storageProjects.length === 0) return;

  // Check if an instance for the active project already exists
  const activeConfig = storageProjects[activeProjectIndex];
  if (!admin.apps.some(app => app?.name === activeConfig.projectId)) {
    admin.initializeApp({
      credential: admin.credential.cert(activeConfig.creds),
    }, activeConfig.projectId);
  }
}

// Initial initialization
initializeActiveStorageApp();


// --- Exported Functions ---

/**
 * Gets the Firebase Auth instance for verifying tokens from the main frontend app.
 */
export function getPrimaryAuth() {
  const primaryApp = admin.app('PRIMARY_AUTH');
  if (!primaryApp) {
      throw new Error('Primary Auth app is not initialized. Check MAIN_APP_PROJECT_ID in .env.local');
  }
  return primaryApp.auth();
}

/**
 * Gets the Firestore database instance for the currently active storage project.
 */
export function getActiveStorageDb() {
  if (storageProjects.length === 0) {
    throw new Error('No storage projects are configured.');
  }
  const activeProjectId = storageProjects[activeProjectIndex].projectId;
  return admin.app(activeProjectId).firestore();
}

/**
 * Switches to the next storage project in the pool and returns its ID.
 */
export function switchToNextProject(): string | null {
  if (storageProjects.length <= 1) return getActiveProjectId();

  // Move to the next index, looping back to the start if necessary.
  activeProjectIndex = (activeProjectIndex + 1) % storageProjects.length;
  
  // Ensure the new active app is initialized
  initializeActiveStorageApp();

  return storageProjects[activeProjectIndex].projectId;
}

/**
 * Returns the ID of the currently active storage project.
 */
export function getActiveProjectId(): string | null {
    if (storageProjects.length === 0) return null;
    return storageProjects[activeProjectIndex].projectId;
}
