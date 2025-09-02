import { NextRequest, NextResponse } from 'next/server';
import { getActiveStorageDb } from '@/lib/firebase-admin';

// This is the secret key that client applications must provide to use the proxy.
const API_ACCESS_KEY = process.env.API_ACCESS_KEY;

export async function POST(req: NextRequest) {
  // 1. Authenticate the request using a secret API key
  const providedApiKey = req.headers.get('X-API-Key');

  if (!API_ACCESS_KEY) {
    console.error('API_ACCESS_KEY is not set on the server.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  if (providedApiKey !== API_ACCESS_KEY) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing API Key.' }, { status: 401 });
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

  // 3. Perform the database operation
  try {
    const db = getActiveStorageDb();
    const pathString = path.join('/');
    
    // NOTE: In the previous version, we checked user ID (UID).
    // Since we are now using a single API key for all apps,
    // this kind of user-specific rule is no longer applicable here.
    // Any app with the key has full access as defined by the proxy's capabilities.

    let result: any;

    switch (operation) {
      case 'getDoc':
        const doc = await db.doc(pathString).get();
        result = doc.exists ? { id: doc.id, ...doc.data() } : null;
        break;
      case 'addDoc':
        const collectionRef = db.collection(pathString);
        const newDocRef = await collectionRef.add(payload);
        result = { id: newDocRef.id };
        break;
      case 'setDoc':
        await db.doc(pathString).set(payload, { merge: true });
        result = { success: true, id: path[path.length - 1] };
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
    console.error(`Firestore operation failed: ${error.message}`);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
