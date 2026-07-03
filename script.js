// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3B42mC2SmIMSNchZVmrhj3MctOhUsNeQ",
  authDomain: "resume-50784.firebaseapp.com",
  projectId: "resume-50784",
  storageBucket: "resume-50784.firebasestorage.app",
  messagingSenderId: "746548464618",
  appId: "1:746548464618:web:8b1c69248f7689faeac093",
  measurementId: "G-4WMPV0SXCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);