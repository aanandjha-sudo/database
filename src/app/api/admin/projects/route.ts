
import { NextRequest, NextResponse } from 'next/server';
import { getManagementDb } from '@/lib/firebase-admin';

const PROJECTS_COLLECTION = '_proxy_projects';

function validateAdminSecret(req: NextRequest) {
    const adminSecret = req.headers.get('X-Admin-Secret');
    if (!process.env.ADMIN_SECRET_KEY || adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return false;
    }
    return true;
}

// GET all projects
export async function GET(req: NextRequest) {
    if (!validateAdminSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const db = getManagementDb();
        const snapshot = await db.collection(PROJECTS_COLLECTION).get();
        const projects = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        return NextResponse.json(projects, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to list projects', details: error.message }, { status: 500 });
    }
}

// POST a new project
export async function POST(req: NextRequest) {
    if (!validateAdminSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { name, credentials } = await req.json();
        if (!name || !credentials) {
            return NextResponse.json({ error: 'Missing required fields: name, credentials' }, { status: 400 });
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(credentials);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON credentials format' }, { status: 400 });
        }

        const projectId = serviceAccount.project_id;
        if (!projectId) {
            return NextResponse.json({ error: '`project_id` missing from credentials' }, { status: 400 });
        }

        const db = getManagementDb();
        const projectDoc = {
            name,
            credentials,
            createdAt: new Date().toISOString()
        };

        await db.collection(PROJECTS_COLLECTION).doc(projectId).set(projectDoc);
        
        return NextResponse.json({ id: projectId, name }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to add project', details: error.message }, { status: 500 });
    }
}

// DELETE a project
export async function DELETE(req: NextRequest) {
    if (!validateAdminSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing project ID in query parameter' }, { status: 400 });
    }

    try {
        const db = getManagementDb();
        await db.collection(PROJECTS_COLLECTION).doc(id).delete();
        // Note: This doesn't delete associated API keys, they will just stop working.
        // A more robust solution might cascade deletes.
        return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500 });
    }
}
