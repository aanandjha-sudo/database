
import { NextRequest, NextResponse } from 'next/server';
import { getActiveStorageDb } from '@/lib/firebase-admin';

// This endpoint is for managing API keys.
// It uses the ADMIN_SECRET_KEY for authorization.

const KEYS_COLLECTION = '_proxy_api_keys';

// Helper function to get the database.
function getManagementDb() {
    try {
        return getActiveStorageDb();
    } catch (e: any) {
        console.error("Management DB Error: ", e.message);
        throw new Error('No storage project configured. Please check your setup in src/lib/firebase-admin.ts.');
    }
}


export async function GET(req: NextRequest) {
    const adminSecret = req.headers.get('X-Admin-Secret');

    if (!process.env.ADMIN_SECRET_KEY || adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getManagementDb();
        const snapshot = await db.collection(KEYS_COLLECTION).get();
        const keys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(keys, { status: 200 });
    } catch (error: any) {
        console.error('Failed to list keys:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const adminSecret = req.headers.get('X-Admin-Secret');

    if (!process.env.ADMIN_SECRET_KEY || adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
        }

        const db = getManagementDb();
        const apiKey = `proxy_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
        
        const newKeyData = {
            name,
            key: apiKey,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection(KEYS_COLLECTION).add(newKeyData);
        
        return NextResponse.json({ id: docRef.id, ...newKeyData }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create key:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}


export async function DELETE(req: NextRequest) {
     const adminSecret = req.headers.get('X-Admin-Secret');

    if (!process.env.ADMIN_SECRET_KEY || adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing key ID in query parameter' }, { status: 400 });
    }

    try {
        const db = getManagementDb();
        await db.collection(KEYS_COLLECTION).doc(id).delete();
        return NextResponse.json({ message: 'Key deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Failed to delete key:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
