import { NextRequest, NextResponse } from 'next/server';
import { getPrimaryAuth, getActiveStorageDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  // 1. Authenticate the request
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await getPrimaryAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }

  const uid = decodedToken.uid;

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

    // IMPORTANT: Add custom security logic here if needed.
    // For example, ensure a user can only edit their own profile.
    if (path[0] === 'users' && path[1] !== uid) {
       // return NextResponse.json({ error: 'Permission denied: You can only access your own data.' }, { status: 403 });
    }

    let result: any;

    switch (operation) {
      case 'getDoc':
        const doc = await db.doc(pathString).get();
        result = doc.exists ? { id: doc.id, ...doc.data() } : null;
        break;
      case 'addDoc':
        // Note: `addDoc` requires a collection path, not a document path.
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
