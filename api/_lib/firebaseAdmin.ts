/**
 * Firebase Admin – server-side tilgang til Firestore + verifisering av
 * innlogging. Kjører fra Vercel-funksjonene (ikke Cloud Functions), så
 * tjenestekontoen leses fra miljøvariabelen FIREBASE_SERVICE_ACCOUNT.
 *
 * FIREBASE_SERVICE_ACCOUNT = hele service-account-JSON-en som én streng
 * (Firebase Console → Prosjektinnstillinger → Tjenestekontoer → Generer ny
 * privat nøkkel). Firestore er gratis på Spark-planen; Admin-SDK-en trenger
 * ikke Blaze.
 */
import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function serviceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT mangler i miljøet.')
  // Firebase-JSON-en bruker snake_case; map til ServiceAccount (camelCase).
  const sa = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string }
  return {
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    // Ved lagring i miljøvariabel blir linjeskift ofte til literal «\n».
    privateKey: sa.private_key?.replace(/\\n/g, '\n'),
  }
}

const app: App = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount()) })

export const db = getFirestore(app)
export const adminAuth = getAuth(app)
