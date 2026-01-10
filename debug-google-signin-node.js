// Debug script for Google Sign-In approval flow (Node.js version)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugGoogleSignInFlow() {
    console.log('=== Debugging Google Sign-In Flow ===');
    console.log('Project ID:', process.env.VITE_FIREBASE_PROJECT_ID);

    try {
        // Check for approved Google users
        console.log('\n1. Checking Approved Google Users:');
        try {
            const approvedCollection = collection(db, 'approved_google_users');
            const approvedSnapshot = await getDocs(approvedCollection);

            console.log(`Found ${approvedSnapshot.size} approved Google users:`);
            approvedSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${doc.id}: ${data.name} (${data.role})`);
                console.log(`     Approved by: ${data.approvedBy}`);
                console.log(`     Temp UID: ${data.uid}`);
                console.log(`     Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'N/A'}`);
            });
        } catch (error) {
            console.error('❌ Error checking approved Google users:', error.message);
        }

        // Check pending users
        console.log('\n2. Checking Pending Users:');
        try {
            const pendingQuery = query(
                collection(db, 'pending_users'),
                where('authProvider', '==', 'google')
            );
            const pendingSnapshot = await getDocs(pendingQuery);

            console.log(`Found ${pendingSnapshot.size} pending Google users:`);
            pendingSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${data.email}: ${data.name} (${data.status})`);
                console.log(`     Requested: ${data.requestedAt ? new Date(data.requestedAt.seconds * 1000).toLocaleString() : 'N/A'}`);
                if (data.approvedBy) {
                    console.log(`     Approved by: ${data.approvedBy}`);
                }
            });
        } catch (error) {
            console.error('❌ Error checking pending users:', error.message);
        }

        // Check user profiles
        console.log('\n3. Checking User Profiles:');
        try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);

            console.log(`Found ${usersSnapshot.size} user profiles:`);
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${doc.id}: ${data.email} (${data.role})`);
                console.log(`     Name: ${data.name}`);
                console.log(`     Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'N/A'}`);
                console.log(`     Last Login: ${data.lastLogin ? new Date(data.lastLogin.seconds * 1000).toLocaleString() : 'N/A'}`);
            });
        } catch (error) {
            console.error('❌ Error checking user profiles:', error.message);
        }

        // Test specific emails that might be problematic
        const testEmails = ['kingdavid28a@gmail.com']; // Add any specific emails to test

        for (const testEmail of testEmails) {
            console.log(`\n4. Testing specific email: ${testEmail}`);

            // Check if approved
            try {
                const approvedDoc = await getDoc(doc(db, 'approved_google_users', testEmail));
                if (approvedDoc.exists()) {
                    console.log('✅ Email found in approved_google_users:', approvedDoc.data());
                } else {
                    console.log('❌ Email NOT found in approved_google_users');
                }
            } catch (error) {
                console.error('❌ Error checking approved status:', error.message);
            }

            // Check if has user profile
            try {
                const userQuery = query(
                    collection(db, 'users'),
                    where('email', '==', testEmail)
                );
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    userSnapshot.forEach(doc => {
                        console.log('✅ User profile found:', doc.id, doc.data());
                    });
                } else {
                    console.log('❌ No user profile found for email');
                }
            } catch (error) {
                console.error('❌ Error checking user profile:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Debug script failed:', error);
    }

    console.log('\n=== End Debug ===');
    console.log('Analysis:');
    console.log('1. If user is in approved_google_users but sign-in fails:');
    console.log('   - Check if processGoogleSignInResult is working correctly');
    console.log('   - Verify the user profile creation logic');
    console.log('2. If user is not in approved_google_users:');
    console.log('   - Check if the approval process completed successfully');
    console.log('   - Verify the email matches exactly (case-sensitive)');
}

// Run the debug
debugGoogleSignInFlow().catch(console.error);