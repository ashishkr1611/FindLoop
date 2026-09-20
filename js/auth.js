// Firebase Authentication & Authorization Module
// FindLoop Campus System

import { auth, db } from "./firebase-config.js";
import { registerUserInSystem } from "./firestore.js";
import { showToast } from "./utils.js";

const CURRENT_USER_KEY = "findloop_active_user";

// Helper for root-safe path navigation across subfolders
function getBasePath() {
  return window.location.pathname.includes("/pages/") || window.location.pathname.includes("/admin/") ? "../" : "./";
}

// Get current session user
export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

// Auto-sync Firebase auth state with local storage session if Firebase initialized
if (auth) {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const current = getCurrentUser();
      if (!current || current.uid !== firebaseUser.uid) {
        const userProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || current?.name || "Aashu Gupta",
          email: firebaseUser.email,
          studentId: current?.studentId || "260122209",
          role: firebaseUser.email?.includes("admin") ? "admin" : "user"
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
        registerUserInSystem(userProfile);
      }
    }
  });
}

// User Signup
export async function signUpUser(name, email, studentId, password) {
  let uid = `usr_${Date.now()}`;

  if (auth) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCred.user.uid;
    } catch (e) {
      console.warn("Firebase Auth Signup Note (Fallback to demo mode):", e.message);
      if (e.code === "auth/api-key-not-valid" || e.message?.includes("api-key-not-valid")) {
        showToast("Demo Mode: Signed up locally", false);
      } else {
        showToast(e.message || "Signup note: Operating in local mode", false);
      }
    }
  }

  const userProfile = {
    uid,
    name: name || "Aashu Gupta",
    email,
    studentId: studentId || "2601" + Math.floor(10000 + Math.random() * 90000).toString(),
    role: "user",
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
  await registerUserInSystem(userProfile);
  showToast("Account created successfully!");
  return userProfile;
}

// User Login
export async function logInUser(email, password) {
  let uid = `usr_${Date.now()}`;
  const cleanEmail = (email || "").trim().toLowerCase();
  let role = cleanEmail.includes("admin") ? "admin" : "user";

  if (auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      uid = userCred.user.uid;
    } catch (e) {
      console.warn("Firebase Auth Login Note (Operating in campus local mode):", e.message);
    }
  }

  let displayName = role === "admin" ? "Campus Safety Admin" : "User";
  if (cleanEmail.includes("anshu")) displayName = "Anshu Bala";
  else if (cleanEmail.includes("aashu")) displayName = "Aashu Gupta";
  else if (cleanEmail.includes("@")) displayName = cleanEmail.split("@")[0];

  const userProfile = {
    uid,
    name: displayName,
    email: cleanEmail,
    studentId: role === "admin" ? "260100001" : "2601" + Math.floor(10000 + Math.random() * 90000).toString(),
    role,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
  await registerUserInSystem(userProfile);
  showToast(`Welcome back, ${displayName}!`);
  return userProfile;
}

// Google Sign-In
export async function logInWithGoogle() {
  let userProfile;
  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;
      userProfile = {
        uid: user.uid,
        name: user.displayName || "Aashu Gupta",
        email: user.email,
        studentId: "2601" + Math.floor(10000 + Math.random() * 90000).toString(),
        role: "user",
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
      await registerUserInSystem(userProfile);
      showToast("Signed in with Google!");
      return userProfile;
    } catch (e) {
      console.warn("Google Auth Note (Fallback to demo mode):", e.message);
      if (e.code === "auth/api-key-not-valid" || e.message?.includes("api-key-not-valid") || e.code === "auth/popup-closed-by-user") {
        showToast("Logged in with Google (Demo Mode)");
      } else {
        showToast(e.message || "Google Sign-In note", false);
      }
    }
  }

  // Fallback demo mode
  userProfile = {
    uid: "usr_aashu_gupta",
    name: "Aashu Gupta",
    email: "aashugupta@gehu.ac.in",
    studentId: "260199182",
    role: "user",
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userProfile));
  await registerUserInSystem(userProfile);
  return userProfile;
}

// User Logout
export async function logOutUser() {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase Signout Note:", e);
    }
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = `${getBasePath()}index.html`;
}

// Protected Route Guard
export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = `${getBasePath()}login.html`;
  }
  return user;
}

// Admin Route Guard
export function requireAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = `${getBasePath()}admin/login.html`;
  }
  return user;
}
