// Migration script to add existing files to Firestore for AI search
// Run this once to make existing files searchable

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Your Firebase config (copy from src/lib/firebase.ts)
const firebaseConfig = {
    // Add your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add your existing file
async function migrateExistingFiles() {
    try {
        console.log('Adding existing files to Firestore...');

        // Add the Format.FinRep.xlsx file
        const fileDoc = {
            name: 'Format.FinRep.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 54710, // 54.71 KB
            url: 'https://example.com/Format.FinRep.xlsx', // Replace with actual URL
            uploadedBy: 'system', // Replace with actual user ID
            category: 'Reports',
            description: 'Financial report format template',
            createdAt: new Date('2026-02-04'), // Upload date
            accessLevel: 'staff',
            organizationId: null
        };

        const docRef = await addDoc(collection(db, 'files'), fileDoc);
        console.log('File added to Firestore with ID:', docRef.id);

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
    }
}

migrateExistingFiles();