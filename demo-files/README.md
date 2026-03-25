# Demo Test Files

This folder contains sample files for testing the SRP AI OS document import and AI extraction features.

## Files Included

| File | Type | Purpose |
|------|------|---------|
| `sample-leads.csv` | CSV | 8 sample leads with contact info, status, and values |
| `sample-organizations.csv` | CSV | 6 sample organizations with contract details |
| `sample-invoice.txt` | TXT | Sample invoice document for AI extraction testing |
| `sample-contract.txt` | TXT | Sample service agreement for AI document parsing |

## How to Test

1. **Login** with demo credentials: `admin@srpaios.demo` / `Admin@1234`
2. Navigate to **Documents AI** in the sidebar
3. Click **Upload Document** or drag & drop files into the drop zone
4. Supported formats: PDF, DOC, DOCX, Excel (XLS/XLSX), CSV, TXT, Images (JPG, PNG, WebP)
5. Files up to 10MB each are accepted
6. Multiple files can be uploaded simultaneously

## Expected Behavior

- Files are saved to the server storage
- AI extraction job is queued for each document
- Document appears in the Documents list with "PENDING" status
- AI processes the document and extracts structured data
