import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let initialized = false;
let initializing = false;

export function ensureFirebaseInitialized() {
  if (initialized) return admin;
  
  // Prevent multiple initialization attempts
  if (initializing) {
    // Wait for initialization to complete
    const checkInterval = setInterval(() => {
      if (initialized) {
        clearInterval(checkInterval);
        return admin;
      }
    }, 100);
    
    // Fallback timeout
    setTimeout(() => clearInterval(checkInterval), 5000);
    return admin;
  }
  
  initializing = true;

  // Option 1: JSON file path
  const credsPath = process.env.FIREBASE_CREDENTIALS_PATH;
  if (credsPath) {
    const resolved = path.isAbsolute(credsPath) ? credsPath : path.join(process.cwd(), credsPath);
    try {
      const buf = fs.readFileSync(resolved, 'utf8');
      const svc = JSON.parse(buf);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(svc) });
      }
      initialized = true;
      initializing = false;
      return admin;
    } catch (e) {
      console.error('[firebase] Failed to read FIREBASE_CREDENTIALS_PATH:', e.message);
    }
  }

  // Option 2: individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[firebase] Missing service account envs. Provide FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    throw new Error('Firebase credentials not properly configured. Please check your .env file.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
  }

  initialized = true;
  initializing = false;
  return admin;
}

export function db() {
  ensureFirebaseInitialized();
  return admin.firestore();
}
