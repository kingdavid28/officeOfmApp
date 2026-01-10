import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

app.use(cors());
app.use(express.json());

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'User profile not found' });
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }

    req.user = { uid: decodedToken.uid, ...userData };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create user endpoint
app.post('/api/users', verifyAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user with Firebase Admin
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: true
    });

    // Create user profile in Firestore
    const profile = {
      uid: userRecord.uid,
      email,
      role,
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: req.user.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(profile);

    res.json({ 
      success: true, 
      user: { uid: userRecord.uid, email, name, role } 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'Failed to create user';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email address is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    }

    res.status(400).json({ error: errorMessage });
  }
});

// Delete user endpoint
app.delete('/api/users/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;

    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Delete from Firestore
    await db.collection('users').doc(uid).delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});