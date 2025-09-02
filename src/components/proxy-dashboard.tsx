
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Info, Loader2, KeyRound, Copy, Database, Code, Trash2, PlusCircle, Server, FileCode, Clapperboard, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/alert-dialog";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ProxyDashboardProps {
  initialManagementProjectId: string | null;
  error: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  projectId: string;
}

interface StorageProject {
    id: string;
    name: string;
}

export function ProxyDashboard({ initialManagementProjectId, error }: ProxyDashboardProps) {
  const [managementProjectId, setManagementProjectId] = useState(initialManagementProjectId);
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isKeyLoading, setIsKeyLoading] = useState(false);

  const [storageProjects, setStorageProjects] = useState<StorageProject[]>([]);
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCreds, setNewProjectCreds] = useState('');
  
  const [proxyUrl, setProxyUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProxyUrl(`${window.location.origin}/api/proxy`);
    }
  }, []);
  
  const clientAppSetupCode = `
// In your client app (game, website, etc.)

const PROXY_URL = '${proxyUrl || 'YOUR_DEPLOYED_APP_URL/api/proxy'}';
const API_KEY = 'proxy_...'; // <-- PASTE YOUR GENERATED KEY HERE

async function getMyData() {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY 
    },
    body: JSON.stringify({
      operation: 'getDoc',
      path: ['users', 'user123']
    })
  });
  
  const data = await response.json();
  console.log(data);
}

getMyData();
`.trim();

  const fetchData = async () => {
    if (!adminSecret) {
      setApiKeys([]);
      setStorageProjects([]);
      return;
    }
    setIsKeyLoading(true);
    setIsProjectLoading(true);
    try {
      const [keysRes, projectsRes] = await Promise.all([
        fetch('/api/admin/keys', { headers: { 'X-Admin-Secret': adminSecret } }),
        fetch('/api/admin/projects', { headers: { 'X-Admin-Secret': adminSecret } })
      ]);

      if (!keysRes.ok) {
        const err = await keysRes.json();
        throw new Error(err.error || 'Failed to fetch API keys.');
      }
      const keysData = await keysRes.json();
      setApiKeys(keysData);

      if (!projectsRes.ok) {
        const err = await projectsRes.json();
        throw new Error(err.error || 'Failed to fetch storage projects.');
      }
      const projectsData = await projectsRes.json();
      setStorageProjects(projectsData);
      // Set a default project for the dropdown if none is selected
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
      setApiKeys([]);
      setStorageProjects([]);
    } finally {
      setIsKeyLoading(false);
      setIsProjectLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [adminSecret]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret || !newKeyName || !selectedProjectId) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide an Admin Secret, a key name, and select a project.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminSecret },
        body: JSON.stringify({ name: newKeyName, projectId: selectedProjectId })
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
    try {
      const response = await fetch(`/api/admin/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': adminSecret },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete key.');
      toast({ title: 'API Key Deleted' });
      setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret || !newProjectName || !newProjectCreds) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a project name and its service account credentials.' });
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch('/api/admin/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminSecret },
            body: JSON.stringify({ name: newProjectName, credentials: newProjectCreds })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to add project.');
        toast({ title: 'Storage Project Added!', description: `Project '${data.name}' is now available.` });
        setStorageProjects(prev => [...prev, data]);
        // Reset form
        setNewProjectName('');
        setNewProjectCreds('');
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

    const handleDeleteProject = async (projectId: string) => {
        if (!adminSecret) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/projects?id=${projectId}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Secret': adminSecret },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to delete project.');
            toast({ title: 'Project Deleted' });
            setStorageProjects((prev) => prev.filter((p) => p.id !== projectId));
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const isServiceActive = managementProjectId && !error;

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
          <CardDescription>The proxy service status and the active management project.</CardDescription>
        </CardHeader>
        <CardContent>
           <Alert className="mt-4">
              <Server className="h-4 w-4" />
              <AlertTitle>Manual Setup Required for Deployment</AlertTitle>
              <AlertDescription>
                For this service to function, you must set the `FIREBASE_MANAGEMENT_CREDENTIALS` and `ADMIN_SECRET_KEY` environment variables in your hosting provider (e.g., Netlify, Vercel). The service is currently {isServiceActive ? `using **${managementProjectId}** for management` : "inactive because credentials are not configured."}
              </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <Code className="h-5 w-5 text-primary" />
            How to Use: Multi-Project Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-full">
            <p>This service now supports multiple Firebase projects. Here's how it works:</p>
            <ol>
                <li><strong>Management Project:</strong> One Firebase project, designated as the "management" project, stores the configuration for all the others. You set its credentials as an environment variable.</li>
                <li><strong>Storage Projects:</strong> You add all your other Firebase projects via the "Storage Project Management" panel below. Their credentials get stored securely in the management database.</li>
                <li><strong>API Keys:</strong> When you generate an API key, you assign it to a specific storage project. The key will only have access to that project's database.</li>
            </ol>
            <p>This allows a single proxy deployment to securely serve multiple independent applications.</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
            type="password"
            placeholder="Enter Admin Secret Key to manage projects and keys"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="flex-grow"
        />
      </div>

      <Collapsible defaultOpen={true}>
        <Card>
            <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                    <CardTitle className="font-headline flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                           <Database className="h-5 w-5 text-primary" />
                           Storage Project Management
                        </div>
                        <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CardTitle>
                    <CardDescription>Add or remove Firebase projects that the proxy can connect to.</CardDescription>
                </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Add new project form */}
                        <div className="space-y-4">
                             <h4 className="font-medium text-lg">Add New Storage Project</h4>
                             <form onSubmit={handleAddProject} className="space-y-3">
                                <Input
                                    type="text"
                                    placeholder="Project Name (e.g., My Awesome Game)"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    disabled={!adminSecret || !isServiceActive || isLoading}
                                />
                                <Textarea
                                    placeholder="Paste entire Service Account JSON here"
                                    value={newProjectCreds}
                                    onChange={(e) => setNewProjectCreds(e.target.value)}
                                    disabled={!adminSecret || !isServiceActive || isLoading}
                                    className="font-mono text-xs"
                                    rows={5}
                                />
                                <Button type="submit" disabled={!adminSecret || !isServiceActive || isLoading || !newProjectName || !newProjectCreds} className="w-full">
                                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <PlusCircle className="mr-2" />}
                                    Add Project
                                </Button>
                             </form>
                        </div>
                        {/* List of existing projects */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-lg">Configured Projects</h4>
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Project ID</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isProjectLoading && <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2"/>Loading...</TableCell></TableRow>}
                                        {!adminSecret && !isProjectLoading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Enter Admin Secret to view projects.</TableCell></TableRow>}
                                        {adminSecret && storageProjects.length === 0 && !isProjectLoading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No storage projects added.</TableCell></TableRow>}
                                        {adminSecret && storageProjects.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{p.id}</TableCell>
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
                                                            This will permanently delete the project <span className="font-bold">'{p.name}'</span>. Any API keys linked to it will stop working.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                          <AlertDialogAction className="bg-destructive" onClick={() => handleDeleteProject(p.id)}>Delete</AlertDialogAction>
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
                    </div>
                </CardContent>
            </CollapsibleContent>
        </Card>
      </Collapsible>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            API Key Generator
          </CardTitle>
           <CardDescription>
            Generate unique API keys and assign them to a storage project.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                type="text"
                placeholder="Name for new key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                disabled={!adminSecret || !isServiceActive || storageProjects.length === 0}
                />
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={!adminSecret || !isServiceActive || storageProjects.length === 0}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                        {storageProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button type="submit" disabled={!adminSecret || !isServiceActive || isLoading || !newKeyName || storageProjects.length === 0}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <PlusCircle className="mr-2" />}
                    Generate Key
                </Button>
            </form>

              <div className="mt-4 border rounded-md">
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isKeyLoading && <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2"/>Loading...</TableCell></TableRow>}
                      {!adminSecret && !isKeyLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Enter Admin Secret to manage keys.</TableCell></TableRow>}
                      {adminSecret && apiKeys.length === 0 && !isKeyLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No API keys found.</TableCell></TableRow>}
                      {adminSecret && apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{storageProjects.find(p => p.id === key.projectId)?.name || key.projectId}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <span>{key.key}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(key.key)}><Copy className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the key for <span className="font-bold">'{key.name}'</span>.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => handleDeleteKey(key.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3"><FileCode className="h-5 w-5 text-primary" />Client App Example</CardTitle>
          <CardDescription>Use this code in your client app to securely read and write data via the proxy.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="relative mt-4 rounded-md bg-muted/50 p-4 font-code text-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => copyToClipboard(clientAppSetupCode)}><Copy className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Copy code</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <pre className="overflow-x-auto whitespace-pre-wrap">{clientAppSetupCode}</pre>
            </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
