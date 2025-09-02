
import { NextRequest, NextResponse } from 'next/server';

// This functionality is disabled in the simplified setup as we now only support one project.
// If you need multi-project support, you would need to re-implement the logic
// from the previous version in `src/lib/firebase-admin.ts`.
export async function POST(req: NextRequest) {
    return NextResponse.json({ 
        error: 'Multi-project switching is not supported in this simplified configuration.' 
    }, { status: 501 });
}
