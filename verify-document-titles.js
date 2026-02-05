// Simple verification script to check document titles
// 
// HOW TO USE:
// 1. Start your app: npm run dev
// 2. Open browser and navigate to your app (e.g., http://localhost:5174)
// 3. Open browser console (F12 or Right-click → Inspect → Console)
// 4. Copy and paste this entire file into the console
// 5. Press Enter to run the test
//
// This will test the title extraction logic with sample data

console.log('🔍 Testing Document Title Extraction Logic...');
console.log('='.repeat(60));

// Test the title extraction logic directly
function testTitleExtraction() {
    // Simulate document data as it might appear in Firestore
    const testDocuments = [
        {
            id: 'doc1',
            name: 'Format.FinRep.xlsx',
            category: 'Reports',
            url: 'https://storage.googleapis.com/bucket/Documents/1234_Format.FinRep.xlsx'
        },
        {
            id: 'doc2',
            name: undefined,
            filename: 'financail report format ofm.png',
            category: 'Reports',
            url: 'https://storage.googleapis.com/bucket/Documents/5678_financail%20report%20format%20ofm.png'
        },
        {
            id: 'doc3',
            name: null,
            title: 'Letter to all under Specialization Program',
            category: 'Correspondence',
            content: 'CORRESPONDENCE DOCUMENT specialization program details...'
        },
        {
            id: 'doc4',
            name: 'undefined',
            category: 'Documents',
            url: 'blob:https://example.com/abc123'
        }
    ];

    console.log('Testing title extraction for sample documents:');

    testDocuments.forEach((doc, index) => {
        let documentTitle = '';

        // Apply the same logic as in simple-document-search.ts
        if (doc.name && doc.name !== 'undefined' && doc.name !== null && doc.name.trim() !== '') {
            documentTitle = doc.name;
        } else if (doc.filename && doc.filename !== 'undefined' && doc.filename !== null && doc.filename.trim() !== '') {
            documentTitle = doc.filename;
        } else if (doc.title && doc.title !== 'undefined' && doc.title !== null && doc.title.trim() !== '') {
            documentTitle = doc.title;
        } else if (doc.url && typeof doc.url === 'string' && doc.url !== 'https://example.com/file.pdf') {
            // Extract filename from URL if available
            const urlParts = doc.url.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
                // Decode and clean up the filename
                documentTitle = decodeURIComponent(lastPart)
                    .replace(/^\d+_/, '') // Remove timestamp prefix
                    .replace(/%20/g, ' ') // Replace URL encoded spaces
                    .replace(/\?.*$/, ''); // Remove query parameters
            }
        }

        // Final fallback with better naming
        if (!documentTitle || documentTitle === 'undefined' || documentTitle === 'null' || documentTitle.trim() === '') {
            if (doc.category && doc.category !== 'undefined') {
                documentTitle = `${doc.category} Document`;
            } else {
                documentTitle = `Document ${doc.id.substring(0, 8)}`;
            }
        }

        // Clean up the title one more time
        documentTitle = documentTitle.replace(/^undefined\s*/, '').replace(/\s*undefined$/, '').trim();
        if (!documentTitle) {
            documentTitle = 'Document';
        }

        console.log(`\n📄 Test Document ${index + 1}:`, {
            originalData: {
                name: doc.name,
                filename: doc.filename,
                title: doc.title,
                category: doc.category,
                url: doc.url ? doc.url.substring(0, 50) + '...' : 'No URL'
            },
            extractedTitle: documentTitle,
            extractionMethod: getExtractionMethod(doc, documentTitle)
        });
    });
}

function getExtractionMethod(doc, finalTitle) {
    if (doc.name && doc.name !== 'undefined' && doc.name !== null && doc.name.trim() !== '') {
        return 'From name field';
    } else if (doc.filename && doc.filename !== 'undefined' && doc.filename !== null && doc.filename.trim() !== '') {
        return 'From filename field';
    } else if (doc.title && doc.title !== 'undefined' && doc.title !== null && doc.title.trim() !== '') {
        return 'From title field';
    } else if (doc.url && typeof doc.url === 'string' && doc.url !== 'https://example.com/file.pdf') {
        return 'Extracted from URL';
    } else if (finalTitle.includes('Document')) {
        return 'Fallback to category + Document';
    } else {
        return 'Default fallback';
    }
}

// Run the test
testTitleExtraction();

console.log('\n' + '='.repeat(60));
console.log('✅ Title extraction test complete!');
console.log('\n💡 INTERPRETATION:');
console.log('   - If all titles look good → The fix is working correctly');
console.log('   - If you see "undefined" → There may be an issue with the logic');
console.log('\n💡 NEXT STEPS:');
console.log('   1. Test actual search in your app');
console.log('   2. Check File Manager for proper titles');
console.log('   3. Ask AI direct questions about documents');
console.log('   4. Run content processing if needed');
console.log('\n📖 See TESTING_INSTRUCTIONS.md for detailed testing guide');