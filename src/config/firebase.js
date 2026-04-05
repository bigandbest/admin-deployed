import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDbffAj-onJZOoEttM4X0sdaTCUk_0DAoY',
  authDomain: 'robust-habitat-409916.firebaseapp.com',
  projectId: 'robust-habitat-409916',
  storageBucket: 'robust-habitat-409916.firebasestorage.app',
  messagingSenderId: '561287644532',
  appId: '1:561287644532:web:4d8e4f8b3e9c1a2b5d9f0e1c',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app;
