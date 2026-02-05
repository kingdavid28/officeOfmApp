# Testing Document Title Fixes

## How to Test the Fixes

Since the debug scripts need to run in the browser context (not Node.js), follow these steps:

### Step 1: Start Your Development Server

```bash
npm run dev
```

### Step 2: Open Your App in Browser

Navigate to `http://localhost:5174` (or whatever port Vite is using)

### Step 3: Test Document Titles in Search

1. **Open the AI Chat Interface** in your app
2. **Search for documents** using queries like:
   - "format finrep"
   - "financial report"
   - "letter specialization"
   - "all documents"

3. **Check the search results** - titles should now show proper names like:
   - ✅ "Format.FinRep.xlsx" (instead of "undefined")
   - ✅ "Letter to all under Specialization Program" (instead of "undefined")
   - ✅ "financail report format ofm.png" (instead of "undefined")

### Step 4: Test Direct Document Questions

Ask the AI specific questions about documents:

1. **"What is format finrep?"**
   - Should provide detailed information about the financial report template
   - Should show proper document title in the response

2. **"What is the letter to all under specialization program?"**
   - Should provide specific information about the correspondence document
   - Should explain the document's purpose and content

3. **"Tell me about the financial report format"**
   - Should recognize the document and provide details
   - Should show proper file information

### Step 5: Check File Manager

1. **Navigate to File Manager** in your app
2. **Check file listings** - all files should show proper names
3. **No "undefined" titles** should appear

### Step 6: Run Content Processing (Optional)

If you have existing files with missing names, run content processing to fix them:

1. In the File Manager, look for a **"Process Files"** button
2. Click it to process all files and fix any missing names
3. Refresh and verify titles are now correct

### Step 7: Browser Console Verification (Advanced)

If you want to verify the title extraction logic directly:

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)
2. **Copy and paste** the contents of `verify-document-titles.js`
3. **Press Enter** to run the test
4. **Check the output** - it will show how titles are extracted from sample data

## Expected Results

### ✅ Search Results
- All documents show meaningful names
- No "undefined" titles
- Proper file extensions visible (e.g., .xlsx, .png, .docx)

### ✅ AI Responses
- Specific answers to direct document questions
- Proper document titles in AI responses
- Detailed information about document types and content

### ✅ File Manager
- All files display with proper names
- Consistent naming across the interface
- Easy to identify documents

## Troubleshooting

### If you still see "undefined" titles:

1. **Check the browser console** for any errors
2. **Run content processing** to fix existing documents
3. **Clear browser cache** and reload the page
4. **Check Firestore database** - some documents might need manual fixing

### If AI doesn't answer document questions:

1. **Make sure documents are indexed** - run content processing
2. **Check that files have extractedContent** in Firestore
3. **Verify search is working** - try general searches first
4. **Check browser console** for any API errors

## Manual Database Check (If Needed)

If issues persist, you can check the Firestore database directly:

1. Go to **Firebase Console** → **Firestore Database**
2. Open the **"files"** collection
3. Check a few documents and verify they have:
   - ✅ `name` field with proper value (not "undefined")
   - ✅ `category` field
   - ✅ `extractedContent` field (if processed)
   - ✅ `url` field with valid URL

4. If documents are missing `name` fields:
   - Run content processing in the app
   - Or manually update them in Firestore Console

## Success Criteria

✅ **All document titles display properly** (no "undefined")
✅ **AI provides specific answers** to document questions
✅ **Search results are clear** and easy to understand
✅ **File Manager shows proper names** for all files
✅ **Consistent naming** throughout the application

## Next Steps After Testing

Once you've verified the fixes work:

1. **Deploy to production** if everything looks good
2. **Monitor user feedback** for any remaining issues
3. **Run content processing** on production database if needed
4. **Document any edge cases** you discover

## Need Help?

If you encounter issues:
- Check the browser console for errors
- Review the `DOCUMENT_TITLE_FIXES_SUMMARY.md` for technical details
- Verify all files were saved correctly
- Make sure the development server restarted after changes