/* Firebase dùng chung project ant05-efa02 với app mía đường (sugar-cane).
   API key của Firebase web là public theo thiết kế — quyền thật do rules quyết định.
   File bài nộp KHÔNG nằm ở đây — chuyển sang Cloudflare R2 qua workers/th-sua-files. */
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || 'AIzaSyBpasZ72EgIovTCVHokMpTYiXWdQolB1qc',
  authDomain: 'ant05-efa02.firebaseapp.com',
  databaseURL: 'https://ant05-efa02-default-rtdb.firebaseio.com',
  projectId: 'ant05-efa02',
  storageBucket: 'ant05-efa02.firebasestorage.app',
  messagingSenderId: '314608297930',
  appId: '1:314608297930:web:6bd7efdc38efa70bd0d133',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

/* DEV + VITE_FB_EMULATOR=1 → nói chuyện với `firebase emulators:start` cục bộ thay vì production. */
if (import.meta.env.DEV && import.meta.env.VITE_FB_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
