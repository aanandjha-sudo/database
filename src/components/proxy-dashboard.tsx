
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Info, Loader2, KeyRound, Copy, Database, Code, Trash2, PlusCircle, Server } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const clientAppSetupCode = `
// In your client app (game, website, etc.)

// The URL of your deployed proxy service.
// This will be the URL where you host this gatekeeper app.
const PROXY_URL = 'YOUR_DEPLOYED_APP_URL/api/proxy';

// The unique API key you generated from this dashboard.
const API_KEY = 'proxy_...'; // <-- PASTE YOUR GENERATED KEY HERE

async function getMyData() {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY // Authenticates your app
    },
    body: JSON.stringify({
      operation: 'getDoc',
      path: ['users', 'user123'] // Example: get a document
    })
  });
  
  const data = await response.json();
  console.log(data);
  return data;
}
`.trim();


export function ProxyDashboard({ initialActiveProjectId, error }: ProxyDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState(initialActiveProjectId);
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const fetchApiKeys = async () => {
    if (!adminSecret) {
        setIsKeyLoading(false);
        return;
    }
    setIsKeyLoading(true);
    try {
      const response = await fetch('/api/admin/keys', {
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch keys. Is the Admin Secret correct?');
      }
      const data = await response.json();
      setApiKeys(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
      setApiKeys([]); // Clear keys on error
    } finally {
      setIsKeyLoading(false);
    }
  };
  
  // Fetch keys when admin secret changes
  useEffect(() => {
    fetchApiKeys();
  }, [adminSecret]);


  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret || !newKeyName) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide an Admin Secret and a name for the key.' });
      return;
    }
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!adminSecret) return;
    setIsLoading(true);
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
                <CheckCircle className="mr-2 h-4 w-4" /> Active & Configured
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" /> Inactive
              </Badge>
            )}
          </CardTitle>
          <CardDescription>The proxy service is now automatically configured and connected to a Firebase project.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Active Database Project ID:</span>
            {isServiceActive ? (
              <span className="font-mono font-bold text-accent">{activeProjectId}</span>
            ) : (
              <span className="font-mono font-bold text-destructive-foreground bg-destructive px-2 py-1 rounded-md">Not Configured</span>
            )}
          </div>
           <Alert className="mt-4">
              <Server className="h-4 w-4" />
              <AlertTitle>Setup is Complete!</AlertTitle>
              <AlertDescription>
                This gatekeeper application is now connected to a Firebase project. You no longer need to manually configure it.
              </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            Admin Panel & API Key Generator
          </CardTitle>
           <CardDescription>
            Enter your Admin Secret Key to generate and manage unique API keys for your client apps.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="password"
                      placeholder="Enter Admin Secret Key to manage keys"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="flex-grow"
                    />
                </div>

                <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2">
                    <Input
                    type="text"
                    placeholder="Name for new key (e.g. My Game App)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    disabled={!adminSecret || !isServiceActive}
                    />
                    <Button type="submit" disabled={!adminSecret || !isServiceActive || isLoading || !newKeyName}>
                        {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <PlusCircle className="mr-2" />}
                        Generate Key
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
                                <span>Loading...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {!adminSecret && !isKeyLoading && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Enter Admin Secret to view and manage keys.
                          </TableCell>
                        </TableRow>
                      )}
                      {adminSecret && !isKeyLoading && apiKeys.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">No API keys found. Generate one above.</TableCell>
                        </TableRow>
                      )}
                      {adminSecret && apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <span>{key.key}</span>
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
              </div>
            </CardContent>
        </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <Code className="h-5 w-5 text-primary" />
            How to Use: Connect Your Client App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
              <h3 className="font-semibold mb-2">Step 1: Generate an API Key</h3>
              <p className="text-sm text-muted-foreground mb-4">
               Use the "Admin Panel" above to create a unique API key for your game, website, or other application.
              </p>
          </div>
          <div>
              <h3 className="font-semibold mb-2">Step 2: Use the Key in Your Client App</h3>
              <p className="text-sm text-muted-foreground mb-4">
               In your client application's code, use the snippet below. Replace `YOUR_DEPLOYED_APP_URL` with the public URL of this gatekeeper app, and replace `proxy_...` with the key you generated.
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
      
    </div>
  );
}

    