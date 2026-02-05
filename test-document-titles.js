// Test script to check document titles in search results
// Run this in browser console on your app

async function testDocumentTitles() {
    try {
        console.log('🔍 Testing document title extraction...');

        // Import the search service
        const { SimpleDocumentSearch } = await import('./src/lib/simple-document-search.ts');
        const { useAuth } = await import('./src/app/contexts/AuthContext.tsx');

        // Create a test search query
        const searchQuery = {
            query: 'format finrep',
            userRole: 'super_admin',
            userId: 'test-user',
            limit: 10
        };

        console.log('Search query:', searchQuery);

        // Perform search
        const results = await SimpleDocumentSearch.searchDocuments(searchQuery);

        console.log(`Found ${results.length} documents:`);

        results.forEach((doc, index) => {
            console.log(`\n📄 Document ${index + 1}:`, {
                id: doc.id,
                title: doc.title,
                type: doc.type,
                category: doc.category,
                relevanceScore: doc.relevanceScore,
                hasContent: !!(doc.content && doc.content.length > 0),
                contentPreview: doc.content ? doc.content.substring(0, 100) + '...' : 'No content'
            });
        });

        // Test AI response generation
        console.log('\n🤖 Testing AI response generation...');
        const { AIChatService } = await import('./src/lib/ai-chat-service.ts');

        const aiResponse = await AIChatService.generateResponse(
            'what is format finrep',
            results,
            'super_admin'
        );

        console.log('\nAI Response:', {
            answer: aiResponse.answer.substring(0, 200) + '...',
            confidence: aiResponse.confidence,
            sourcesCount: aiResponse.sources.length
        });

        console.log('\n✅ Test complete!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testDocumentTitles();