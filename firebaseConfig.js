// firebaseConfig.js

// Import only what you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase web config
const firebaseConfig = {
  apiKey: "AIzaSyBw6IotQYIYfiTXq0vvMCA9Rk8UleLNaUo",
  authDomain: "gigconnectskill-sa.firebaseapp.com",
  projectId: "gigconnectskill-sa",
  storageBucket: "gigconnectskill-sa.appspot.com",
  messagingSenderId: "291699433541",
  appId: "1:291699433541:web:d3b8659e61ec8ad84bc32c"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in your screens
export { auth, db };
