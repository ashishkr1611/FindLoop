// Cloud Firestore Database Operations Module
// FindLoop Campus System

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { generateItemCode, generateQRToken, generateVerificationCode } from "./utils.js";

// LOCAL SEED DATA ENGINE FALLBACK FOR DEMO TESTING
const SEED_USER = {
  uid: "usr_anshu_123",
  name: "Anshu Bala",
  email: "anshubala@gehu.ac.in",
  studentId: "260122209",
  role: "user",
  createdAt: "2026-08-15T10:00:00Z"
};

const SEED_ITEMS = [
  {
    itemId: "item_calc_101",
    ownerId: "usr_anshu_123",
    itemCode: "FL-N86EN",
    qrToken: "tok_calc_982",
    itemName: "Casio Scientific Calculator",
    category: "Electronics",
    color: "Black",
    description: "Scientific Calculator with name sticker on back.",
    privateDetail: "Serial No. 991-882",
    status: "LOST",
    qrActive: true,
    createdAt: "2026-09-14T10:00:00Z",
    updatedAt: "2026-09-14T10:00:00Z"
  },
  {
    itemId: "item_demo_103",
    ownerId: "usr_anshu_123",
    itemCode: "FL-8X92K",
    qrToken: "tok_demo_8x92k",
    itemName: "Apple AirPods Pro Case",
    category: "Electronics",
    color: "White",
    description: "White charging case with red silicone cover.",
    privateDetail: "Initials AB written inside lid",
    status: "LOST",
    qrActive: true,
    createdAt: "2026-09-15T10:00:00Z",
    updatedAt: "2026-09-15T10:00:00Z"
  },
  {
    itemId: "item_bottle_102",
    ownerId: "usr_anshu_123",
    itemCode: "FL-W77TK",
    qrToken: "tok_bottle_112",
    itemName: "Milton Water Bottle",
    category: "Daily Essentials",
    color: "Silver",
    description: "Silver 1L bottle with blue strap.",
    privateDetail: "Bottom has small dent",
    status: "SAFE",
    qrActive: true,
    createdAt: "2026-09-14T11:00:00Z",
    updatedAt: "2026-09-14T11:00:00Z"
  }
];

const SEED_REPORTS = [
  {
    reportId: "rep_1789476673091",
    itemId: "item_calc_101",
    location: "Security Desk",
    specificLocation: "Main Gate Guard Room",
    foundTime: "2026-09-15T12:00:00Z",
    handoverLocation: "Security Desk (Main Gate)",
    message: "Found near CS Lab 3 desk.",
    verificationCode: "482910",
    status: "HANDOVER_READY",
    createdAt: "2026-09-15T12:00:00Z"
  }
];

const SEED_NOTIFICATIONS = [];
const SEED_HISTORY = [];

function getStore() {
  const data = localStorage.getItem("findloop_firestore_demo");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.items && parsed.reports) {
        return parsed;
      }
    } catch {
      localStorage.removeItem("findloop_firestore_demo");
    }
  }
  const init = {
    users: [SEED_USER],
    items: [...SEED_ITEMS],
    reports: [...SEED_REPORTS],
    notifications: [...SEED_NOTIFICATIONS],
    history: [...SEED_HISTORY]
  };
  localStorage.setItem("findloop_firestore_demo", JSON.stringify(init));
  return init;
}

function saveStore(store) {
  localStorage.setItem("findloop_firestore_demo", JSON.stringify(store));
}

// ----------------------------------------------------
// FIRESTORE & LOCAL STORE OPERATIONS
// ----------------------------------------------------

// 1. ITEMS OPERATIONS
export async function createItemInFirestore(itemData) {
  const itemCode = generateItemCode();
  const qrToken = generateQRToken();
  const itemId = `item_${Date.now()}`;

  const newItem = {
    itemId,
    ownerId: itemData.ownerId || "usr_anshubala_123",
    itemCode,
    qrToken,
    itemName: itemData.itemName,
    category: itemData.category,
    color: itemData.color || "Default",
    description: itemData.description || "",
    privateDetail: itemData.privateDetail || "",
    status: "SAFE",
    qrActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Local Store sync (instant UI response & fallback)
  const store = getStore();
  store.items.unshift(newItem);
  store.history.unshift({
    historyId: `hist_${Date.now()}`,
    itemId,
    action: "CREATED",
    description: "Registered item and generated QR tag.",
    userId: newItem.ownerId,
    timestamp: new Date().toISOString()
  });
  saveStore(store);

  // 2. Firestore Cloud sync
  if (db) {
    try {
      await setDoc(doc(db, "items", itemId), newItem);
      await addDoc(collection(db, "itemHistory"), {
        itemId,
        action: "CREATED",
        description: "Registered item and generated QR tag.",
        userId: newItem.ownerId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore write error, falling back:", e);
    }
  }

  return newItem;
}

export async function getUserItems(ownerId) {
  if (db) {
    try {
      const q = query(collection(db, "items"), where("ownerId", "==", ownerId));
      const querySnapshot = await getDocs(q);
      const itemsList = [];
      querySnapshot.forEach((doc) => itemsList.push(doc.data()));
      return itemsList;
    } catch (e) {
      console.warn("Firestore fetch error, using local fallback:", e);
    }
  }
  const store = getStore();
  return store.items.filter(item => !ownerId || item.ownerId === ownerId);
}

export async function getItemByIdOrToken(codeOrToken) {
  if (!codeOrToken) return null;
  let clean = decodeURIComponent(codeOrToken).trim();

  // If clean is a full URL, extract token or id query param
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const url = new URL(clean);
      clean = url.searchParams.get("token") || url.searchParams.get("id") || clean;
    } catch (e) {
      console.warn("URL parse warning:", e);
    }
  }

  clean = clean.trim();
  const cleanUpper = clean.toUpperCase();

  // 1. Check local store FIRST for instant lookup & background cloud sync
  const store = getStore();
  const localFound = store.items.find(
    (i) =>
      i.itemId === clean ||
      (i.itemCode && i.itemCode.toUpperCase() === cleanUpper) ||
      i.qrToken === clean ||
      (i.qrToken && i.qrToken.toLowerCase() === clean.toLowerCase())
  );

  if (localFound) {
    if (db) {
      setDoc(doc(db, "items", localFound.itemId), localFound).catch((e) => console.warn("Background Firestore sync note:", e));
    }
    return localFound;
  }

  // 2. Check Cloud Firestore
  if (db) {
    try {
      const qTok = query(collection(db, "items"), where("qrToken", "==", clean));
      const snapTok = await getDocs(qTok);
      if (!snapTok.empty) {
        const item = snapTok.docs[0].data();
        if (!store.items.some((i) => i.itemId === item.itemId)) {
          store.items.unshift(item);
          saveStore(store);
        }
        return item;
      }

      const qCode = query(collection(db, "items"), where("itemCode", "==", cleanUpper));
      const snapCode = await getDocs(qCode);
      if (!snapCode.empty) {
        const item = snapCode.docs[0].data();
        if (!store.items.some((i) => i.itemId === item.itemId)) {
          store.items.unshift(item);
          saveStore(store);
        }
        return item;
      }

      const qId = query(collection(db, "items"), where("itemId", "==", clean));
      const snapId = await getDocs(qId);
      if (!snapId.empty) {
        const item = snapId.docs[0].data();
        if (!store.items.some((i) => i.itemId === item.itemId)) {
          store.items.unshift(item);
          saveStore(store);
        }
        return item;
      }
    } catch (e) {
      console.warn("Firestore item lookup error:", e);
    }
  }

  return null;
}

export async function updateItemStatus(itemId, newStatus) {
  const store = getStore();
  const item = store.items.find((i) => i.itemId === itemId || i.itemCode === itemId);
  if (item) {
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    store.history.unshift({
      historyId: `hist_${Date.now()}`,
      itemId: item.itemId,
      action: `MARKED_${newStatus}`,
      description: `Status changed to ${newStatus}.`,
      userId: item.ownerId,
      timestamp: new Date().toISOString()
    });
    saveStore(store);
  }

  if (db) {
    try {
      await updateDoc(doc(db, "items", itemId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore update error:", e);
    }
  }
}

export async function regenerateItemQRToken(itemId) {
  const newQrToken = generateQRToken();
  const timestamp = new Date().toISOString();

  const store = getStore();
  const item = store.items.find((i) => i.itemId === itemId);
  if (item) {
    item.qrToken = newQrToken;
    item.updatedAt = timestamp;
    store.history.unshift({
      historyId: `hist_${Date.now()}`,
      itemId,
      action: "QR_REGENERATED",
      description: "Regenerated new QR tag token. Old physical QR token deactivated.",
      userId: item.ownerId,
      timestamp
    });
    saveStore(store);
  }

  if (db) {
    try {
      await updateDoc(doc(db, "items", itemId), {
        qrToken: newQrToken,
        updatedAt: timestamp
      });
      await addDoc(collection(db, "itemHistory"), {
        itemId,
        action: "QR_REGENERATED",
        description: "Regenerated new QR tag token. Old physical QR token deactivated.",
        userId: item ? item.ownerId : "system",
        timestamp
      });
    } catch (e) {
      console.warn("Firestore regenerate QR token error:", e);
    }
  }

  return newQrToken;
}

// 2. FOUND REPORTS & HANDOVER
export async function submitFoundReportInFirestore(reportData) {
  const reportId = `rep_${Date.now()}`;
  const verificationCode = generateVerificationCode();

  const newReport = {
    reportId,
    itemId: reportData.itemId,
    location: reportData.location,
    specificLocation: reportData.specificLocation || "",
    foundTime: new Date().toISOString(),
    handoverLocation: reportData.handoverLocation || "Security Desk",
    message: reportData.message || "",
    verificationCode,
    status: "HANDOVER",
    createdAt: new Date().toISOString()
  };

  const store = getStore();
  store.reports.unshift(newReport);

  // Update item status to FOUND
  const item = store.items.find((i) => i.itemId === reportData.itemId || i.itemCode === reportData.itemId);
  if (item) {
    item.status = "FOUND";
    item.updatedAt = new Date().toISOString();

    // Create Notification
    store.notifications.unshift({
      notificationId: `notif_${Date.now()}`,
      userId: item.ownerId,
      itemId: item.itemId,
      reportId: newReport.reportId,
      title: `🎉 Someone found your ${item.itemName}!`,
      message: `Found at ${reportData.location}. Handover desk: ${newReport.handoverLocation}.`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  saveStore(store);
  return newReport;
}

export async function verifyHandoverCodeInFirestore(reportId, codeInput) {
  const store = getStore();
  const report = store.reports.find((r) => r.reportId === reportId);

  if (!report) {
    return { success: false, message: "Handover report record not found." };
  }

  if (report.verificationCode !== codeInput.trim()) {
    return { success: false, message: "Invalid verification code. Please check with the handover desk." };
  }

  report.status = "RESOLVED";

  const item = store.items.find((i) => i.itemId === report.itemId);
  if (item) {
    item.status = "RETURNED";
    item.updatedAt = new Date().toISOString();

    store.notifications.unshift({
      notificationId: `notif_${Date.now()}`,
      userId: item.ownerId,
      itemId: item.itemId,
      reportId: report.reportId,
      title: `✓ ${item.itemName} returned successfully`,
      message: `Handover verification completed at ${report.handoverLocation}.`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  saveStore(store);
  return { success: true, message: "Verification successful! Item marked as RETURNED." };
}

export async function updateReportStatusInFirestore(reportId, newStatus) {
  const store = getStore();
  const report = store.reports.find((r) => r.reportId === reportId);
  if (report) {
    report.status = newStatus;
    report.updatedAt = new Date().toISOString();
    saveStore(store);
  }

  if (db) {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firestore report update note:", e);
    }
  }

  return { success: true, status: newStatus };
}

// 3. NOTIFICATIONS
export async function getNotificationsForUser(userId) {
  const store = getStore();
  return store.notifications.filter(n => !userId || n.userId === userId);
}

export async function markNotificationRead(notifId) {
  const store = getStore();
  const n = store.notifications.find((i) => i.notificationId === notifId);
  if (n) {
    n.read = true;
    saveStore(store);
  }
}

// 4. ADMIN STATS & MODERATION (100% Real Live Calculation)
export async function getAllReportsAdmin() {
  if (db) {
    try {
      const snap = await getDocs(collection(db, "reports"));
      const reports = [];
      snap.forEach(doc => reports.push(doc.data()));
      if (reports.length > 0) return reports;
    } catch (e) {
      console.warn("Firestore reports fetch note:", e);
    }
  }
  const store = getStore();
  return store.reports;
}

export async function getAllItemsAdmin() {
  const store = getStore();
  let cloudItems = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, "items"));
      snap.forEach(doc => cloudItems.push(doc.data()));
    } catch (e) {
      console.warn("Firestore items fetch note:", e);
    }
  }

  const itemMap = new Map();
  if (store.items && Array.isArray(store.items)) {
    store.items.forEach(item => {
      if (item && (item.itemId || item.itemCode)) {
        itemMap.set(item.itemId || item.itemCode, item);
      }
    });
  }

  cloudItems.forEach(item => {
    if (item && (item.itemId || item.itemCode)) {
      itemMap.set(item.itemId || item.itemCode, item);
    }
  });

  const allItems = Array.from(itemMap.values());

  if (db && allItems.length > 0) {
    allItems.forEach(item => {
      if (!cloudItems.some(ci => ci.itemId === item.itemId)) {
        setDoc(doc(db, "items", item.itemId), item).catch(e => console.warn("Admin auto-sync item note:", e));
      }
    });
  }

  return allItems;
}

export async function getAllUsersAdmin() {
  const store = getStore();
  let cloudUsers = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      snap.forEach(doc => cloudUsers.push(doc.data()));
    } catch (e) {
      console.warn("Firestore users fetch note:", e);
    }
  }

  const userMap = new Map();
  if (store.users && Array.isArray(store.users)) {
    store.users.forEach(u => {
      if (u && (u.uid || u.email)) {
        userMap.set(u.uid || u.email, u);
      }
    });
  }

  cloudUsers.forEach(u => {
    if (u && (u.uid || u.email)) {
      userMap.set(u.uid || u.email, u);
    }
  });

  const allUsers = Array.from(userMap.values());

  if (db && allUsers.length > 0) {
    allUsers.forEach(u => {
      if (!cloudUsers.some(cu => cu.uid === u.uid)) {
        setDoc(doc(db, "users", u.uid || `usr_${Date.now()}`), u).catch(e => console.warn("Admin auto-sync user note:", e));
      }
    });
  }

  return allUsers;
}

export async function getAdminStatsData() {
  const reports = await getAllReportsAdmin();
  const items = await getAllItemsAdmin();

  const totalItems = items.length;
  const lostCount = items.filter((i) => i.status === "LOST").length;
  const foundReports = reports.length;
  const returnedItems = items.filter((i) => i.status === "RETURNED").length;

  const totalResolved = returnedItems + lostCount;
  const recoveryRate = totalResolved > 0 ? Math.round((returnedItems / totalResolved) * 100) : (totalItems > 0 ? 100 : 0);

  return {
    totalItems,
    currentlyLost: lostCount,
    foundReports,
    returnedItems,
    recoveryRate
  };
}
