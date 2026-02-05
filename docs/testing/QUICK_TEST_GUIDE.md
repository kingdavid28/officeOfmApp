# Quick Test Guide - Document Title Fixes

## 🚀 Quick Start (2 Minutes)

### 1. Start Your App
```bash
npm run dev
```

### 2. Open in Browser
Navigate to `http://localhost:5174`

### 3. Test Search
In the AI Chat Interface, search for:
```
format finrep
```

**Expected Result:** You should see "Format.FinRep.xlsx" (not "undefined")

### 4. Test Direct Question
Ask the AI:
```
what is format finrep?
```

**Expected Result:** AI should provide detailed information about the financial report template

---

## ✅ Quick Checklist

- [ ] Document titles show proper names in search results
- [ ] No "undefined" titles anywhere
- [ ] AI answers direct questions about documents
- [ ] File Manager shows proper file names
- [ ] Content processing button available (if needed)

---

## 🔧 If Something's Wrong

### Still seeing "undefined"?
1. Check browser console for errors (F12)
2. Clear browser cache and reload
3. Run content processing in File Manager
4. Check `TROUBLESHOOTING_AUTH.md` for common issues

### AI not answering questions?
1. Make sure documents are indexed
2. Run content processing
3. Check that search is working first
4. Verify files have content in Firestore

---

## 📊 Test in Browser Console (Optional)

1. Open Console (F12)
2. Paste contents of `verify-document-titles.js`
3. Press Enter
4. Check output for title extraction logic

---

## 📝 What Was Fixed

**Before:**
- ❌ Titles showing as "undefined"
- ❌ Generic AI responses
- ❌ Hard to identify documents

**After:**
- ✅ Proper document names (e.g., "Format.FinRep.xlsx")
- ✅ Specific AI answers about documents
- ✅ Easy to identify and find documents

---

## 📚 More Information

- **Detailed Testing:** See `TESTING_INSTRUCTIONS.md`
- **Technical Details:** See `DOCUMENT_TITLE_FIXES_SUMMARY.md`
- **Troubleshooting:** Check browser console and Firestore

---

## 🎯 Success = All Green Checkmarks Above!