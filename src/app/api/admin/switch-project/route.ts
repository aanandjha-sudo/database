
import { NextRequest, NextResponse } from 'next/server';
import { switchToNextProject, getActiveProjectId } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('X-Admin-Secret');

  // 1. Secure the endpoint with a secret key
  if (!process.env.ADMIN_SECRET_KEY || adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Trigger the switch
    const newActiveProject = switchToNextProject();
    
    if (!newActiveProject) {
        return NextResponse.json({ error: 'No storage projects configured to switch to.' }, { status: 500 });
    }

    // 3. Return the new active project ID
    return NextResponse.json({
      message: 'Successfully switched to the next project.',
      activeProjectId: newActiveProject,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to switch project:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
