// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add your own Firebase configuration from your Firebase project console
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "AIzaSyBw6IotQYIYfiTXq0vvMCA9Rk8UleLNaUo",
  authDomain: "gigconnectskill-sa.firebaseapp.com",
  databaseURL: "https://gigconnectskill-sa-default-rtdb.firebaseio.com",
  projectId: "gigconnectskill-sa",
  storageBucket: "gigconnectskill-sa.firebasestorage.app",
  messagingSenderId: "291699433541",
  appId: "1:291699433541:web:d3b8659e61ec8ad84bc32c",
  measurementId: "G-DCMR9LMM5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
