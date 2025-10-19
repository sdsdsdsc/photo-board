// ---------- script.js (ES Module) ----------
// Keep your existing firebaseConfig object. If it isn't here, paste it below.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import {
  getFirestore,
  collection, addDoc,
  query, orderBy,
  onSnapshot,           // real-time updates
  serverTimestamp,      // consistent timestamps
  getDocs               // used once for quick checks if needed
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ====== 1) Firebase Init ======
const firebaseConfig = window.firebaseConfig || {
  // If you keep config in this file, fill these:
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_AUTH_DOMAIN",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_STORAGE_BUCKET",
  // messagingSenderId: "YOUR_SENDER_ID",
  // appId: "YOUR_APP_ID"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ====== 2) DOM ======
const fileInput   = document.getElementById("fileInput");
const nameInput   = document.getElementById("nameInput");
const msgInput    = document.getElementById("msgInput");
const uploadBtn   = document.getElementById("uploadBtn");
const gallery     = document.getElementById("gallery");
const newsContainer = document.getElementById("newsContainer");

// ====== 3) Helpers ======
function formatTimestamp(ts) {
  // Supports Firestore Timestamp, JS Date, ISO string, or missing
  try {
    if (!ts) return "Unknown date";
    let d;
    if (typeof ts.toDate === "function") {
      d = ts.toDate(); // Firestore Timestamp
    } else if (ts instanceof Date) {
      d = ts;
    } else if (typeof ts === "string" || typeof ts === "number") {
      d = new Date(ts);
    } else if (ts.seconds) {
      d = new Date(ts.seconds * 1000);
    } else {
      return "Unknown date";
    }
    // Local date & time, readable
    return d.toLocaleString();
  } catch {
    return "Unknown date";
  }
}

function el(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html.trim();
  return tmp.firstElementChild;
}

// ====== 4) Upload Photo ======
async function handleUpload() {
  try {
    const file = fileInput?.files?.[0];
    const name = (nameInput?.value || "").trim() || "Anonymous";
    const message = (msgInput?.value || "").trim();

    if (!file) {
      alert("Please choose an image first.");
      return;
    }

    // Upload to storage/uploads/...
    const path = `uploads/${Date.now()}_${file.name}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);

    // Add to Firestore with consistent serverTimestamp
    await addDoc(collection(db, "photos"), {
      name,
      message,
      imageUrl: url,
      likes: 0,
      timestamp: serverTimestamp()
    });

    // Clear inputs
    if (fileInput) fileInput.value = "";
    if (msgInput) msgInput.value = "";

    // UI gives a quick confirmation
    uploadBtn?.classList.add("disabled");
    setTimeout(() => uploadBtn?.classList.remove("disabled"), 600);
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed. Check the console for details.");
  }
}

uploadBtn?.addEventListener("click", handleUpload);

// ====== 5) Real-time Photos (newest first) ======
function startPhotosStream() {
  if (!gallery) return;
  const q = query(collection(db, "photos"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snap) => {
    gallery.innerHTML = "";
    if (snap.empty) {
      gallery.innerHTML = "<p>No photos yet.</p>";
      return;
    }
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const imgUrl = data.imageUrl || "https://placehold.co/480x300?text=No+Image";
      const name = data.name ?? "Anonymous";
      const message = data.message ?? "";
      const dateStr = formatTimestamp(data.timestamp);
      const likes = data.likes ?? 0;

      const card = el(`
        <div class="photo-card">
          <img src="${imgUrl}" alt="photo" />
          <p><strong>${name}</strong></p>
          <p>${message}</p>
          <div class="photo-meta">
            <small class="photo-date">🕒 ${dateStr}</small>
            <button class="like-btn" disabled>❤️ ${likes}</button>
          </div>
        </div>
      `);
      gallery.appendChild(card);
    });
  }, (err) => {
    console.error("photos stream error:", err);
    gallery.innerHTML = "<p>Error loading gallery. Check console.</p>";
  });
}

// ====== 6) Real-time News (newest first) ======
function startNewsStream() {
  if (!newsContainer) return;
  const q = query(collection(db, "news"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snap) => {
    newsContainer.innerHTML = "";
    if (snap.empty) {
      newsContainer.innerHTML = "<p>No news yet.</p>";
      return;
    }
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const title = data.title ?? "Untitled";
      const summary = data.summary ?? "";
      const img = data.imageUrl ?? "https://placehold.co/600x300?text=No+Image";
      const dateStr = formatTimestamp(data.timestamp);

      const card = el(`
        <div class="news-card">
          <img src="${img}" alt="news" />
          <h3><a href="article.html?id=${docSnap.id}" class="news-link">${title}</a></h3>
          <p>${summary}</p>
          <small>🕒 ${dateStr}</small>
        </div>
      `);
      newsContainer.appendChild(card);
    });
  }, (err) => {
    console.error("news stream error:", err);
    newsContainer.innerHTML = "<p>Error loading news. Check console.</p>";
  });
}

// ====== 7) Boot ======
window.addEventListener("DOMContentLoaded", () => {
  startPhotosStream();
  startNewsStream();
});
