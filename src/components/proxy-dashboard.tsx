
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Info, Loader2, KeyRound, Copy, Database, Code, Trash2, PlusCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProxyDashboardProps {
  initialActiveProjectId: string | null;
  error: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

const envSetupCode = `
# .env.local

# Password for the Admin Panel on this dashboard to switch projects.
ADMIN_SECRET_KEY="your-super-secret-key"

# --- Storage Projects ---
# The FIRST project is used for storing API keys.
# All other projects are available for you to switch between.

# Project 1 (Management & e.g., User Data)
STORAGE_PROJECT_1_ID="your-first-db-project-id"
STORAGE_PROJECT_1_CREDS_BASE64="ey..."

# Project 2 (e.g., for Game Data)
# STORAGE_PROJECT_2_ID="your-second-db-project-id"
# STORAGE_PROJECT_2_CREDS_BASE64="ey..."
`.trim();

const clientAppSetupCode = `
// No special SDKs are needed on the client, just standard 'fetch'.
// Below is an example of how to make a request.

// The URL of your deployed proxy service.
const PROXY_URL = 'https://your-proxy-service-url.com/api/proxy';

// A unique API key you generated from the dashboard.
const API_KEY = 'proxy_...'; // <-- This key authenticates your app

async function getUserProfile(userId) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      operation: 'getDoc',
      path: ['users', userId]
    })
  });
  
  const data = await response.json();
  console.log(data);
  return data;
}
`.trim();

const apiExamples = {
  getDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'getDoc',
    path: ['users', 'someUserId']
  })
});`,
  addDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'addDoc',
    path: ['posts'], // Path to a collection
    payload: { 
      title: 'New Post', 
      content: 'Hello World!' 
    }
  })
});`,
  setDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'setDoc',
    path: ['users', 'someUserId'], // Path to a document
    payload: { 
      name: 'John Doe', 
      email: 'john.doe@example.com' 
    }
  })
});`,
  updateDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'updateDoc',
    path: ['users', 'someUserId'], // Path to a document
    payload: { 
      lastLogin: new Date().toISOString()
    }
  })
});`,
  deleteDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'deleteDoc',
    path: ['users', 'someUserId'] // Path to a document
  })
});`
};

const featureExamples = {
  chat: `// Send a new message in a chat room
fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'addDoc',
    path: ['chatRooms', 'room123', 'messages'],
    payload: { 
      text: 'Hey everyone!',
      senderId: 'userABC',
      timestamp: new Date().toISOString()
    }
  })
});`,
  game: `// Update a player's score in a game session
fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'updateDoc',
    path: ['gameSessions', 'sessionXYZ', 'players', 'player1'],
    payload: {
      score: 1500
    }
  })
});`,
  feed: `// Add a new post to the global feed
fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_GENERATED_API_KEY'
  },
  body: JSON.stringify({
    operation: 'addDoc',
    path: ['feed'],
    payload: { 
      authorId: 'userABC',
      content: 'Just discovered this amazing proxy service!',
      likes: 0
    }
  })
});`
};

export function ProxyDashboard({ initialActiveProjectId, error }: ProxyDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState(initialActiveProjectId);
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isKeyLoading, setIsKeyLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');

  const fetchApiKeys = async () => {
    if (!adminSecret) return;
    setIsKeyLoading(true);
    try {
      const response = await fetch('/api/admin/keys', {
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (!response.ok) throw new Error('Failed to fetch keys. Is the Admin Secret correct?');
      const data = await response.json();
      setApiKeys(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
      setApiKeys([]); // Clear keys on error
    } finally {
      setIsKeyLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret || !newKeyName) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide an Admin Secret and a name for the key.' });
      return;
    }
    setIsKeyLoading(true);
    try {
      const response = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminSecret },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create key.');
      toast({ title: 'API Key Created!', description: `A new key for '${data.name}' has been generated.` });
      setApiKeys(prev => [...prev, data]);
      setNewKeyName('');
    } catch (e: any) {
       toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsKeyLoading(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!adminSecret) return;
    try {
      const response = await fetch(`/api/admin/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (!response.ok) throw new Error('Failed to delete key.');
      toast({ title: 'API Key Deleted' });
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };


  const handleSwitchProject = async () => {
    if (!adminSecret) {
      toast({
        variant: 'destructive',
        title: 'Missing Secret',
        description: 'Please enter the admin secret key.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/switch-project', {
        method: 'POST',
        headers: { 'X-Admin-Secret': adminSecret },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to switch project');
      setActiveProjectId(data.activeProjectId);
      toast({
        title: 'Project Switched',
        description: `Active project is now: ${data.activeProjectId}`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error Switching Project',
        description: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };
  
  const isServiceActive = activeProjectId && !error;

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            Service Status
            {isServiceActive ? (
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="mr-2 h-4 w-4" /> Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" /> Inactive
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Current status and configuration of the proxy service.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Active Storage Project ID:</span>
            {isServiceActive ? (
              <span className="font-mono font-bold text-accent">{activeProjectId}</span>
            ) : (
              <span className="font-mono font-bold text-destructive-foreground bg-destructive px-2 py-1 rounded-md">Not Available</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <Accordion type="single" collapsible defaultValue='item-1' className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6 py-4 text-lg font-headline">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Admin Panel
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the `ADMIN_SECRET_KEY` from your `.env` file to manage projects and API keys.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="password"
                      placeholder="Enter Admin Secret Key"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={handleSwitchProject} disabled={isLoading || !isServiceActive}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Switch Project
                    </Button>
                  </div>
                   {!isServiceActive && <p className="text-xs text-destructive">Admin actions are disabled because the service is inactive.</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-primary" />
                Client API Keys
              </CardTitle>
              <CardDescription>
                Generate and manage unique API keys for your client applications. Requires Admin Secret.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Name for new key (e.g. My Game App)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={!adminSecret || !isServiceActive}
                />
                <Button type="submit" disabled={!adminSecret || !isServiceActive || isKeyLoading || !newKeyName}>
                  <PlusCircle className="mr-2" /> Generate
                </Button>
              </form>

              <div className="mt-4 border rounded-md">
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isKeyLoading && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            <div className="flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> 
                                <span>Loading keys... Enter Admin Secret to see keys.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {!isKeyLoading && apiKeys.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">No API keys found.</TableCell>
                        </TableRow>
                      )}
                      {apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <span>{key.key.substring(0, 12)}...</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(key.key)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the key for <span className="font-bold">'{key.name}'</span> and revoke its access. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteKey(key.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
              </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            How to Use: Step-by-Step Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
              <h3 className="font-semibold mb-2">Step 1: Configure Your Proxy Server</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your Firebase project credentials and secret keys to the `.env.local` file of this proxy service. You can get the Service Account JSON from your Firebase project settings, then Base64-encode it. The first project is used for managing API keys.
              </p>
              <div className="relative mt-4 rounded-md bg-muted/50 p-4 font-code text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => copyToClipboard(envSetupCode)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy code</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <pre className="overflow-x-auto whitespace-pre-wrap">{envSetupCode}</pre>
              </div>
          </div>
          <div>
              <h3 className="font-semibold mb-2">Step 2: Configure Your Client Application</h3>
              <p className="text-sm text-muted-foreground mb-4">
               In your client application (e.g., your Next.js frontend, mobile app), you will make `fetch` requests to this proxy service. You must include your `API_ACCESS_KEY` in the `X-API-Key` header to authenticate.
              </p>
              <div className="relative mt-4 rounded-md bg-muted/50 p-4 font-code text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => copyToClipboard(clientAppSetupCode)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy code</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <pre className="overflow-x-auto whitespace-pre-wrap">{clientAppSetupCode}</pre>
              </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <Code className="h-5 w-5 text-primary" />
            API Usage Examples
          </CardTitle>
          <CardDescription>
            Example requests for interacting with the `/api/proxy` endpoint. The proxy will route the request to the currently active database: <span className="font-bold text-accent">{activeProjectId || 'N/A'}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Operations</TabsTrigger>
                <TabsTrigger value="features">Feature-Specific</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
                <Tabs defaultValue="getDoc">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mt-4">
                    <TabsTrigger value="getDoc">getDoc</TabsTrigger>
                    <TabsTrigger value="addDoc">addDoc</TabsTrigger>
                    <TabsTrigger value="setDoc">setDoc</TabsTrigger>
                    <TabsTrigger value="updateDoc">updateDoc</TabsTrigger>
                    <TabsTrigger value="deleteDoc">deleteDoc</TabsTrigger>
                    </TabsList>
                    {Object.entries(apiExamples).map(([key, code]) => (
                    <TabsContent key={key} value={key}>
                        <div className="relative mt-4 rounded-md bg-muted/50 p-4 font-code text-sm">
                        <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 h-7 w-7"
                                onClick={() => copyToClipboard(code)}
                                >
                                <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy code</p>
                            </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <pre className="overflow-x-auto whitespace-pre-wrap">{code}</pre>
                        </div>
                    </TabsContent>
                    ))}
                </Tabs>
            </TabsContent>
            <TabsContent value="features">
                <p className="text-sm text-muted-foreground mt-4 mb-2">Here is how you might structure API calls for different application features. You can direct these features to different databases using the 'Switch Project' button in the Admin Panel.</p>
                <Tabs defaultValue="chat">
                    <TabsList className="grid w-full grid-cols-3 mt-4">
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="game">Game State</TabsTrigger>
                        <TabsTrigger value="feed">Social Feed</TabsTrigger>
                    </TabsList>
                    {Object.entries(featureExamples).map(([key, code]) => (
                    <TabsContent key={key} value={key}>
                        <div className="relative mt-4 rounded-md bg-muted/50 p-4 font-code text-sm">
                        <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 h-7 w-7"
                                onClick={() => copyToClipboard(code)}
                                >
                                <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy code</p>
                            </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <pre className="overflow-x-auto whitespace-pre-wrap">{code}</pre>
                        </div>
                    </TabsContent>
                    ))}
                </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
