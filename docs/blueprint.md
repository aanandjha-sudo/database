# **App Name**: Firebase Proxy Service

## Core Features:

- Secure Firestore Proxy: Acts as a secure intermediary between frontend applications and multiple Firestore databases, verifying user authentication via Firebase Auth before routing requests to backend. The frontend can request documents, and make updates (addDoc, setDoc, updateDoc, deleteDoc) and the tool uses the path to the resource in the backend as well as the authenticated identity of the user to authorize the operation.
- Token Verification: Verifies Firebase ID tokens from the main application to ensure only authenticated users can access Firestore data.
- Database Operation Routing: Routes requests to the appropriate Firestore database based on the application's configuration.
- Admin Project Switching: Allows administrators to switch between different storage projects using a secret key for enhanced security.
- Dynamic Project Configuration: Loads storage project configurations dynamically from environment variables, allowing for easy scaling and management.
- Error Handling and Logging: Robust error handling and logging to monitor and troubleshoot issues with database operations and project switching.

## Style Guidelines:

- Primary color: Deep Indigo (#663399) to evoke a sense of security and reliability.
- Background color: Very light gray (#F0F0F0), creating a clean and unobtrusive backdrop.
- Accent color: Teal (#008080) to add a touch of modernity and highlight interactive elements. 
- Font pairing: 'Inter' (sans-serif) for body and 'Space Grotesk' (sans-serif) for headlines, ensure readability and a modern tech look.
- Code font: 'Source Code Pro' for displaying code snippets and configurations.
- Clean and structured layout with clear visual hierarchy to ensure ease of use and navigation.
- Subtle transitions and animations to provide feedback on user interactions and improve overall experience.