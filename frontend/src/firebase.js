import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // optional

const rimjob_key = import.meta.env.VITE_RIMJOB_KEY;

const firebaseConfig = {
  apiKey: rimjob_key,
  authDomain: "rimjob-sports.firebaseapp.com",
  projectId: "rimjob-sports",
  storageBucket: "rimjob-sports.firebasestorage.app",
  messagingSenderId: "967895280585",
  appId: "1:967895280585:web:ba6f38a24a15884a275618",
  measurementId: "G-XTQXR3K5EG"
};

const app = initializeApp(firebaseConfig);

// Only use this if you actually need analytics
// const analytics = getAnalytics(app);

export default app;