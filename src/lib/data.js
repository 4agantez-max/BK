import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { demoFeedback, defaultSettings, demoWorks } from "../data/works.js";
import { auth, db, firebaseReady } from "./firebase.js";
import { KEYS, readLocal, visitorId, writeLocal } from "./storage.js";

function getDemoWorks() {
  return readLocal("works", demoWorks);
}

function getDemoComments() {
  return readLocal("comments", []);
}

function getDemoFeedback() {
  return readLocal("feedback", demoFeedback);
}

export async function fetchWorks({ includeHidden = false } = {}) {
  if (!firebaseReady) return getDemoWorks().filter((work) => includeHidden || work.visible).sort((a, b) => a.order - b.order);
  const worksQuery = includeHidden
    ? query(collection(db, "works"))
    : query(collection(db, "works"), where("visible", "==", true));
  const snapshot = await getDocs(worksQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => a.order - b.order);
}

export async function fetchSettings() {
  if (!firebaseReady) return readLocal("settings", defaultSettings);
  const snapshot = await getDoc(doc(db, "settings", "config"));
  return snapshot.exists() ? { ...defaultSettings, ...snapshot.data() } : defaultSettings;
}

export async function fetchApprovedComments(workId) {
  if (!firebaseReady) {
    return getDemoComments().filter((comment) => comment.workId === workId && comment.approved && !comment.hidden);
  }
  const commentsQuery = query(
    collection(db, "works", workId, "comments"),
    where("approved", "==", true),
    where("hidden", "==", false),
  );
  const snapshot = await getDocs(commentsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => {
    const left = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
    const right = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
    return right - left;
  });
}

export async function fetchApprovedFeedback() {
  if (!firebaseReady) {
    return getDemoFeedback()
      .filter((item) => item.approved && item.comment?.trim())
      .map(({ id, name, comment, createdAt }) => ({ id, name, comment, createdAt }));
  }
  const feedbackQuery = query(
    collection(db, "publicFeedbackComments"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(feedbackQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function submitWorkComment(workId, { name, text }) {
  const id = `${workId}_${visitorId()}`;
  const payload = {
    name: name.trim() || "Anonim",
    text: text.trim(),
    approved: false,
    hidden: false,
    createdAt: firebaseReady ? serverTimestamp() : new Date().toISOString(),
  };
  if (firebaseReady) {
    await setDoc(doc(db, "works", workId, "comments", id), payload);
    return;
  }
  const comments = getDemoComments();
  if (comments.some((comment) => comment.id === id)) throw new Error("Perangkat ini sudah mengirim komentar untuk karya ini.");
  comments.push({ id, workId, ...payload, createdAt: new Date().toISOString() });
  writeLocal("comments", comments);
}

export async function submitExhibitionFeedback(feedback) {
  const id = visitorId();
  const payload = { ...feedback, approved: false, createdAt: firebaseReady ? serverTimestamp() : new Date().toISOString() };
  if (firebaseReady) {
    await setDoc(doc(db, "exhibitionFeedback", id), payload);
    return;
  }
  const items = getDemoFeedback();
  if (items.some((item) => item.id === id)) throw new Error("Perangkat ini sudah mengirim feedback pameran.");
  items.push({ id, ...payload, createdAt: new Date().toISOString() });
  writeLocal("feedback", items);
}

export async function trackVisit(workId = null) {
  const hadVisitorId = Boolean(localStorage.getItem(KEYS.visitor));
  const id = visitorId();
  const sessionKey = `underwater-visit-${id}`;
  const isNewSession = !sessionStorage.getItem(sessionKey);
  const isNewVisitor = !hadVisitorId;
  if (!isNewSession && !workId) return;
  if (workId && sessionStorage.getItem(`${sessionKey}-${workId}`)) return;
  if (isNewSession) sessionStorage.setItem(sessionKey, "pending");
  if (workId) sessionStorage.setItem(`${sessionKey}-${workId}`, "pending");

  try {
  if (firebaseReady) {
    const batch = writeBatch(db);
    const visitorRef = doc(db, "visitors", id);
    const globalRef = doc(db, "stats", "global");
    if (isNewSession) {
      batch.set(visitorRef, {
        ...(isNewVisitor ? { firstSeen: serverTimestamp(), visitCount: 1 } : { visitCount: increment(1) }),
        lastSeen: serverTimestamp(),
      }, { merge: true });
      batch.set(globalRef, {
        totalVisits: increment(1),
        ...(isNewVisitor ? { uniqueVisitors: increment(1) } : {}),
      }, { merge: true });
    }
    if (workId) {
      batch.set(doc(db, "stats", `works_${workId}`), { workId, views: increment(1) }, { merge: true });
    }
    await batch.commit();
  } else {
    const visitors = readLocal("visitorData", {});
    const stats = readLocal("stats", { totalVisits: 0, uniqueVisitors: 0, workViews: {} });
    if (isNewSession) {
      const current = visitors[id];
      visitors[id] = current
        ? { ...current, lastSeen: new Date().toISOString(), visitCount: current.visitCount + 1 }
        : { firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), visitCount: 1 };
      stats.totalVisits += 1;
      if (isNewVisitor) stats.uniqueVisitors += 1;
      writeLocal("visitorData", visitors);
      writeLocal("stats", stats);
    }
    if (workId) {
      stats.workViews[workId] = (stats.workViews[workId] || 0) + 1;
      writeLocal("stats", stats);
    }
  }
  if (isNewSession) sessionStorage.setItem(sessionKey, "1");
  if (workId) sessionStorage.setItem(`${sessionKey}-${workId}`, "1");
  } catch (error) {
    if (isNewSession) sessionStorage.removeItem(sessionKey);
    if (workId) sessionStorage.removeItem(`${sessionKey}-${workId}`);
    if (isNewVisitor) localStorage.removeItem(KEYS.visitor);
    throw error;
  }
}

export function listenToAuth(callback) {
  if (!firebaseReady) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function verifyAdminUser(user) {
  if (!firebaseReady) return Boolean(user);
  if (!user.email || !user.emailVerified) return false;
  const adminDoc = await getDoc(doc(db, "admins", user.email));
  return adminDoc.exists();
}

export async function loginAdmin(email, password) {
  if (!firebaseReady) {
    if (email === "admin@underwaterroom.id" && password === "underwater-demo") {
      sessionStorage.setItem("underwater-admin-demo", "1");
      return { uid: "demo-admin", email };
    }
    throw new Error("Demo login gagal. Gunakan kredensial demo yang ditampilkan.");
  }
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  if (!result.user.email || !result.user.emailVerified) {
    await signOut(auth);
    throw new Error("Akun Google ini tidak memiliki email terverifikasi.");
  }
  const adminDoc = await getDoc(doc(db, "admins", result.user.email));
  if (!adminDoc.exists()) {
    await signOut(auth);
    throw new Error(`Email ${result.user.email} belum terdaftar sebagai admin di Firestore.`);
  }
  return result.user;
}

export async function logoutAdmin() {
  if (firebaseReady) await signOut(auth);
  else sessionStorage.removeItem("underwater-admin-demo");
}

export function currentDemoAdmin() {
  return !firebaseReady && sessionStorage.getItem("underwater-admin-demo") === "1"
    ? { uid: "demo-admin", email: "admin@underwaterroom.id" }
    : null;
}

export async function fetchAdminSnapshot() {
  if (!firebaseReady) {
    const stats = readLocal("stats", { totalVisits: 0, uniqueVisitors: 0, workViews: {} });
    return {
      works: getDemoWorks(),
      comments: getDemoComments(),
      feedback: getDemoFeedback(),
      visitors: Object.entries(readLocal("visitorData", {})).map(([id, value]) => ({ id, ...value })),
      stats,
      settings: readLocal("settings", defaultSettings),
    };
  }
  const [worksSnapshot, visitorsSnapshot, statsSnapshot, feedbackSnapshot, settingsSnapshot] = await Promise.all([
    getDocs(query(collection(db, "works"), orderBy("order"))),
    getDocs(collection(db, "visitors")),
    getDocs(collection(db, "stats")),
    getDocs(collection(db, "exhibitionFeedback")),
    getDoc(doc(db, "settings", "config")),
  ]);
  const commentsByWork = await Promise.all(worksSnapshot.docs.map(async (work) => {
    const commentsSnapshot = await getDocs(collection(db, "works", work.id, "comments"));
    return commentsSnapshot.docs.map((item) => ({
      id: item.id,
      workId: work.id,
      ...item.data(),
    }));
  }));
  return {
    works: worksSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    visitors: visitorsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    stats: Object.fromEntries(statsSnapshot.docs.map((item) => [item.id, item.data()])),
    feedback: feedbackSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    settings: settingsSnapshot.exists() ? { ...defaultSettings, ...settingsSnapshot.data() } : defaultSettings,
    comments: commentsByWork.flat(),
  };
}

export async function saveWork(work) {
  if (firebaseReady) {
    const { id, ...workData } = work;
    await setDoc(doc(db, "works", id), workData);
    return;
  }
  const works = getDemoWorks();
  const index = works.findIndex((item) => item.id === work.id);
  if (index < 0) works.push(work);
  else works[index] = work;
  writeLocal("works", works);
}

export async function removeWork(workId) {
  if (firebaseReady) {
    await deleteDoc(doc(db, "works", workId));
    return;
  }
  writeLocal("works", getDemoWorks().filter((work) => work.id !== workId));
}

export async function moderateComment(workId, commentId, changes) {
  if (firebaseReady) {
    await updateDoc(doc(db, "works", workId, "comments", commentId), changes);
    return;
  }
  writeLocal("comments", getDemoComments().map((comment) => comment.id === commentId ? { ...comment, ...changes } : comment));
}

export async function deleteComment(workId, commentId) {
  if (firebaseReady) {
    await deleteDoc(doc(db, "works", workId, "comments", commentId));
    return;
  }
  writeLocal("comments", getDemoComments().filter((comment) => comment.id !== commentId));
}

export async function moderateFeedback(id, changes) {
  if (firebaseReady) {
    const feedbackRef = doc(db, "exhibitionFeedback", id);
    const feedback = await getDoc(feedbackRef);
    if (!feedback.exists()) throw new Error("Feedback tidak ditemukan.");
    const next = { ...feedback.data(), ...changes };
    const batch = writeBatch(db);
    batch.update(feedbackRef, changes);
    const publicCommentRef = doc(db, "publicFeedbackComments", id);
    if (next.approved && !next.hidden && next.comment?.trim()) {
      batch.set(publicCommentRef, {
        name: next.name || "Anonim",
        comment: next.comment,
        createdAt: next.createdAt,
      });
    } else {
      batch.delete(publicCommentRef);
    }
    await batch.commit();
    return;
  }
  writeLocal("feedback", getDemoFeedback().map((item) => item.id === id ? { ...item, ...changes } : item));
}

export async function saveSettings(settings) {
  if (firebaseReady) {
    const config = {
      ...settings,
      startAt: settings.startDate ? Timestamp.fromDate(new Date(`${settings.startDate}T00:00:00`)) : null,
      endAt: settings.endDate ? Timestamp.fromDate(new Date(`${settings.endDate}T23:59:59.999`)) : null,
    };
    await setDoc(doc(db, "settings", "config"), config);
    return;
  }
  writeLocal("settings", settings);
}

export function seedDemoData() {
  if (!firebaseReady) {
    if (!sessionStorage.getItem(KEYS.works)) writeLocal("works", demoWorks);
    if (!sessionStorage.getItem(KEYS.settings)) writeLocal("settings", defaultSettings);
    if (!sessionStorage.getItem(KEYS.feedback)) writeLocal("feedback", demoFeedback);
  }
}
