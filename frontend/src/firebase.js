import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // optional

const firebaseConfig = {
  apiKey: "AIzaSyBqVEmoeRvHOnD7O7zZUuQkBvBB7yMrgN8",
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