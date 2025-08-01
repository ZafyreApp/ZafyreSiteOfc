// src/config/firebaseAdmin.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      // A private_key vem com '\n' que precisam ser convertidos para quebrar linha real
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Adicionado para Cloud Storage admin
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

const firebaseAdmin = admin;
export { firebaseAdmin };
