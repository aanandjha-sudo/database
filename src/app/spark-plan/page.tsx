
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Code } from 'lucide-react';

export default function SparkPlanPage() {
  const sparkFeatures = [
    "Authentication: 10k/month",
    "Cloud Firestore: 1 GiB total storage, 50k reads/day, 20k writes/day, 20k deletes/day",
    "Cloud Functions: 125k invocations/month",
    "Cloud Storage: 5 GiB total storage, 1 GB download/day, 20k uploads/day, 50k downloads/day",
    "Hosting: 10 GB storage, 360 MB/day data transfer",
    "Realtime Database: 1 GB storage, 10 GB/month download",
  ];

  const codeChanges = `
fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // An ID token from Firebase Auth must be included
    'Authorization': 'Bearer <YOUR_FIREBASE_ID_TOKEN>'
  },
  body: JSON.stringify({
    operation: 'getDoc',
    path: ['your-collection', 'your-doc-id']
  })
});
`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            Firebase Spark Plan (Free Tier)
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Generous limits to get you started with your Firebase project for free.
          </p>
           <a href="/" className="mt-4 text-primary underline">Back to Login</a>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Key Features & Limits</CardTitle>
              <CardDescription>Usage limits for the Spark plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {sparkFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Changes for Database Access</CardTitle>
              <CardDescription>How your application needs to call the proxy API.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    To access the database via the proxy, your application must authenticate users with Firebase Authentication and send the user's ID token in the Authorization header of each request.
                </p>
                <div className="relative rounded-md bg-muted/50 p-4 font-code text-sm">
                    <Code className="absolute right-2 top-2 h-5 w-5" />
                    <pre className="overflow-x-auto whitespace-pre-wrap">{codeChanges.trim()}</pre>
                </div>
                 <p className="mt-4 text-sm text-muted-foreground">
                    This ensures that only authenticated users can perform database operations, and the backend can enforce security rules. Without a valid ID token, the API will reject the request.
                </p>
            </CardContent>
          </Card>
        </div>
        
        <footer className="text-center mt-12 py-6 text-sm text-muted-foreground border-t">
            <p>For full details, always refer to the official Firebase pricing page.</p>
        </footer>
      </main>
    </div>
  );
}
