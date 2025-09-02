import { getActiveProjectId } from '@/lib/firebase-admin';
import { ProxyDashboard } from '@/components/proxy-dashboard';
import { DatabaseZap } from 'lucide-react';

export default function Home() {
  let initialActiveProjectId: string | null = null;
  let error: string | null = null;

  try {
    // This function can only be called on the server.
    initialActiveProjectId = getActiveProjectId();
    if (!initialActiveProjectId) {
      error = "No storage projects loaded. The proxy service will not function. Please check your .env.local file.";
    }
  } catch (e: any) {
    error = e.message || 'An unexpected error occurred while loading project configuration.';
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <DatabaseZap className="h-16 w-16 mb-4 text-primary" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            Firebase Proxy Service
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            A secure intermediary for routing frontend requests to a pool of storage databases.
          </p>
        </div>
        
        <ProxyDashboard initialActiveProjectId={initialActiveProjectId} error={error} />

        <footer className="text-center mt-12 py-6 text-sm text-muted-foreground border-t">
            <p>Powered by Next.js & Firebase Admin SDK. Styled with Tailwind CSS & shadcn/ui.</p>
        </footer>
      </main>
    </div>
  );
}
