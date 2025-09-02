
import { NextRequest, NextResponse } from 'next/server';
import { getManagementDb, getStorageDb } from '@/lib/firebase-admin';

const KEYS_COLLECTION = '_proxy_api_keys';

interface ApiKeyData {
  key: string;
  projectId: string; // The ID of the Firebase project this key has access to
}

async function validateApiKey(apiKey: string): Promise<ApiKeyData | null> {
  if (!apiKey) {
    return null;
  }
  try {
    const db = getManagementDb(); 
    const keysQuery = await db.collection(KEYS_COLLECTION).where('key', '==', apiKey).limit(1).get();

    if (keysQuery.empty) {
      return null;
    }
    const keyDoc = keysQuery.docs[0];
    const keyData = keyDoc.data();

    return {
      key: keyData.key,
      projectId: keyData.projectId,
    };

  } catch (error) {
    console.error("Error validating API key:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1. Authenticate the request using a provided API key
  const providedApiKey = req.headers.get('X-API-Key');

  if (!providedApiKey) {
    return NextResponse.json({ error: 'Unauthorized: Missing API Key.' }, { status: 401 });
  }

  const validKeyData = await validateApiKey(providedApiKey);
  if (!validKeyData) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key.' }, { status: 401 });
  }

  // 2. Parse the request body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { operation, path, payload } = body;

  if (!operation || !path || !Array.isArray(path) || path.length === 0) {
    return NextResponse.json({ error: 'Missing required fields: operation, path' }, { status: 400 });
  }

  // 3. Perform the database operation on the correct project
  try {
    // Get the specific storage database linked to the API key
    const db = await getStorageDb(validKeyData.projectId);
    const pathString = path.join('/');
    
    let result: any;

    switch (operation) {
      case 'getDoc':
        const doc = await db.doc(pathString).get();
        result = doc.exists ? { id: doc.id, ...doc.data() } : null;
        break;
      case 'getCollection':
         const snapshot = await db.collection(pathString).get();
         result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      case 'addDoc':
        const collectionRef = db.collection(pathString);
        const newDocRef = await collectionRef.add(payload);
        result = { id: newDocRef.id };
        break;
      case 'setDoc':
        await db.doc(pathString).set(payload, { merge: true });
        result = { id: path[path.length - 1] };
        break;
      case 'updateDoc':
        await db.doc(pathString).update(payload);
        result = { success: true };
        break;
      case 'deleteDoc':
        await db.doc(pathString).delete();
        result = { success: true };
        break;
      default:
        return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error(`Firestore operation failed for project ${validKeyData.projectId}: ${error.message}`);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
}
