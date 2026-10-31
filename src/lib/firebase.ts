import { getFirestore } from 'firebase/firestore'
import { app, auth, googleProvider } from './firebaseApp'

export { auth, googleProvider }
export const db = getFirestore(app)
