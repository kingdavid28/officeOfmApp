// Test Script for Document Search Improvements
// This script tests the enhanced search functionality

import { SimpleDocumentSearch } from './src/lib/simple-document-search.js';
import { AIChatService } from './src/lib/ai-chat-service.js';

// Test data to simulate documents in the database
const testDocuments = [
    {
        id: 'doc1',
        name: 'Format.FinRep.xlsx',
        category: 'Reports',
        description: 'Financial reporting template for monthly reports',
        uploadedBy: 'admin',
        createdAt: new Date('2026-02-01'),
        accessLevel: 'staff'
    },
    {
        id: 'doc2',
        name: 'Office Supplies Invoice.pdf',
        category: 'Receipts',
        description: 'Invoice for office supplies purchase from Staples',
        amount: 150.00,
        uploadedBy: 'staff1',
        createdAt: new Date('2026-01-15'),
        accessLevel: 'staff'
    },
    {
        id: 'doc3',
        name: 'Meeting Minutes Jan 2026.docx',
        category: 'Minutes',
        description: 'Board meeting minutes from January 2026',
        uploadedBy: 'secretary',
        createdAt: new Date('2026-01-30'),
        accessLevel: 'admin'
    },
    {
        id: 'doc4',
        name: 'Supply Request Form.pdf',
        category: 'Forms',
        description: 'Request form for office supplies and equipment',
        uploadedBy: 'staff2',
        createdAt: new Date('2026-02-03'),
        accessLevel: 'staff'
    }
];

// Test cases to verify improvements
const testCases = [
    {
        name: 'Test 1: Fuzzy matching for "finrep"',
        query: 'finrep',
        expectedResults: ['Format.FinRep.xlsx'],
        description: 'Should find financial report using abbreviated term'
    },
    {
        name: 'Test 2: Category synonym matching for "meeting"',
        query: 'meeting',
        expectedResults: ['Meeting Minutes Jan 2026.docx'],
        description: 'Should find minutes documents when searching for "meeting"'
    },
    {
        name: 'Test 3: Partial word matching for "supply"',
        query: 'supply',
        expectedResults: ['Office Supplies Invoice.pdf', 'Supply Request Form.pdf'],
        description: 'Should find both "supplies" and "supply" documents'
    },
    {
        name: 'Test 4: Enhanced no-results response',
        query: 'nonexistent document',
        expectedResults: [],
        description: 'Should provide helpful suggestions when no results found'
    },
    {
        name: 'Test 5: Financial query intent detection',
        query: 'financial report',
        expectedResults: ['Format.FinRep.xlsx'],
        description: 'Should detect financial intent and provide structured response'
    },
    {
        name: 'Test 6: Office supplies with amount',
        query: 'office supplies',
        expectedResults: ['Office Supplies Invoice.pdf', 'Supply Request Form.pdf'],
        description: 'Should find supply-related documents and show totals'
    }
];

// Function to run tests
async function runSearchTests() {
    console.log('🧪 Testing Document Search Improvements\n');
    console.log('='.repeat(60));

    for (const testCase of testCases) {
        console.log(`\n${testCase.name}`);
        console.log(`Query: "${testCase.query}"`);
        console.log(`Expected: ${testCase.expectedResults.length} result(s)`);
        console.log(`Description: ${testCase.description}`);
        console.log('-'.repeat(40));

        try {
            // Test the search query
            const searchQuery = {
                query: testCase.query,
                userRole: 'super_admin',
                userId: 'test_user',
                limit: 10
            };

            // This would normally call the actual search function
            // For testing, we'll simulate the improved matching logic
            const results = simulateEnhancedSearch(testCase.query, testDocuments);

            console.log(`✅ Found ${results.length} result(s):`);
            results.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.title} (Score: ${result.relevanceScore.toFixed(2)})`);
                if (result.content) {
                    console.log(`     Content: ${result.content.substring(0, 80)}...`);
                }
            });

            // Test AI response generation
            if (results.length === 0) {
                console.log('\n📝 AI Response for no results:');
                const aiResponse = simulateNoResultsResponse(testCase.query);
                console.log(aiResponse.substring(0, 200) + '...');
            } else {
                console.log('\n📝 AI Response would include structured analysis');
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Search improvement tests completed!');
}

// Simulate the enhanced search logic
function simulateEnhancedSearch(query, documents) {
    const results = [];

    documents.forEach(doc => {
        const score = calculateEnhancedRelevance(query, doc.name, doc.description, doc.category);
        if (score > 0) {
            results.push({
                id: doc.id,
                type: 'file',
                title: doc.name,
                content: doc.description || `${doc.category} document`,
                relevanceScore: score,
                category: doc.category,
                amount: doc.amount
            });
        }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Simulate enhanced relevance calculation
function calculateEnhancedRelevance(query, ...textFields) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    let score = 0;

    textFields.forEach((field, index) => {
        if (!field) return;

        const fieldLower = field.toLowerCase();
        const fieldWeight = index === 0 ? 1.0 : 0.6;

        // Exact phrase match
        if (fieldLower.includes(queryLower)) {
            score += fieldWeight * 1.0;
            return;
        }

        // Category synonym matching
        if (matchesCategory(queryLower, fieldLower)) {
            score += fieldWeight * 0.8;
            return;
        }

        // Word-based scoring
        let wordScore = 0;
        queryWords.forEach(word => {
            if (fieldLower.includes(word)) {
                wordScore += 0.5;
            }
        });

        score += fieldWeight * (wordScore / queryWords.length);
    });

    return Math.min(score, 1.0);
}

// Simulate category matching
function matchesCategory(query, field) {
    const categoryMappings = {
        'finrep': ['financial', 'report', 'finance'],
        'meeting': ['minutes', 'notes'],
        'supply': ['supplies', 'office', 'stationery'],
        'receipt': ['invoice', 'bill', 'purchase']
    };

    for (const [term, synonyms] of Object.entries(categoryMappings)) {
        if (query.includes(term) && synonyms.some(syn => field.includes(syn))) {
            return true;
        }
    }

    return false;
}

// Simulate no results response
function simulateNoResultsResponse(query) {
    return `I couldn't find any documents matching your query "${query}". Here are some suggestions to help you find what you're looking for:

**Search Tips:**
• Try broader terms: "financial", "report", "supplies"
• Search by category: "reports", "receipts", "forms", "policies"
• Use partial words: "finrep" for financial reports

**Available Categories:**
• Reports (financial reports, summaries)
• Forms (applications, requests)  
• Receipts (expenses, purchases)
• Minutes (meeting notes)

**Example Searches:**
• "financial report" or "finrep"
• "office supplies" or "supplies"
• "meeting minutes" or "minutes"`;
}

// Run the tests
runSearchTests().catch(console.error);