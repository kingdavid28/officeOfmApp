# Firebase Admin SDK Setup

## 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (officeofmapp)
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

## 2. Update Environment Variables

Add these values from your service account JSON to `.env`:

```
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_from_json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_from_json\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@officeofmapp.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id_from_json
```

## 3. Install Server Dependencies

```bash
cd server
npm install
```

## 4. Start the Server

```bash
cd server
npm run dev
```

## 5. Update Frontend

The frontend is already updated to use the API service. Make sure your server is running on port 3001.

## Security Notes

- Keep the service account key secure
- Never commit the private key to version control
- Use environment variables for all sensitive data