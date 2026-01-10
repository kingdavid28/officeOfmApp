// Check Approved Google Users
// Run this in the browser console on your test page

async function checkApprovedUsers() {
    console.log('=== Checking Approved Google Users ===');

    try {
        // Import Firestore
        const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');

        const firebaseConfig = {
            apiKey: "AIzaSyDy4jBqxKpD_B6SGAqRLyTrmGxQ9rEA0zw",
            authDomain: "localhost",
            projectId: "officeofmapp",
            storageBucket: "officeofmapp.firebasestorage.app",
            messagingSenderId: "710263745328",
            appId: "1:710263745328:web:a41ed7f9f6df52970db6f5"
        };

        const app = initializeApp(firebaseConfig, 'check-approved');
        const db = getFirestore(app);

        // Get approved Google users
        const snapshot = await getDocs(collection(db, 'approved_google_users'));

        console.log(`Found ${snapshot.size} approved Google users:`);

        snapshot.forEach((doc) => {
            console.log('Email:', doc.id);
            console.log('Data:', doc.data());
            console.log('---');
        });

        if (snapshot.size === 0) {
            console.log('No approved Google users found');
        }

    } catch (error) {
        console.error('Error checking approved users:', error);
    }
}

// Run the check
checkApprovedUsers();