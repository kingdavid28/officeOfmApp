// Debug script to check file document structure in Firestore
// Run this in browser console on your app

async function debugFileDocuments() {
    try {
        // Get Firebase instances
        const { db } = await import('./src/lib/firebase.js');
        const { collection, getDocs } = await import('firebase/firestore');

        console.log('🔍 Debugging file documents...');

        const filesQuery = collection(db, 'files');
        const snapshot = await getDocs(filesQuery);

        console.log(`Found ${snapshot.docs.length} files in database`);

        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n📄 File ${index + 1}:`, {
                id: doc.id,
                name: data.name,
                filename: data.filename,
                title: data.title,
                category: data.category,
                url: data.url ? data.url.substring(0, 50) + '...' : 'No URL',
                hasContent: data.hasContent,
                uploadedBy: data.uploadedBy,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
            });
        });

        console.log('\n✅ Debug complete!');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run the debug
debugFileDocuments();