import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSlzsjq26_yFu7Hi1x6j8R4Yt7uqpARDw",
  authDomain: "alex-photo-board.firebaseapp.com",
  projectId: "alex-photo-board",
  storageBucket: "alex-photo-board.appspot.com",
  messagingSenderId: "1092938868533",
  appId: "1:1092938868533:web:7df0a0832310c2d30d8e7c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function formatTimestamp(ts) {
  try {
    if (!ts) return "Unknown date";
    if (typeof ts === "object" && ts.seconds !== undefined) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === "object" && typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts instanceof Date) return ts.toLocaleString();
    if (typeof ts === "string") { const d = new Date(ts); if (!isNaN(d)) return d.toLocaleString(); }
  } catch { /* ignore */ }
  return "Unknown date";
}

const params = new URLSearchParams(location.search);
const articleId = params.get("id");

async function loadArticle() {
  if (!articleId) { document.getElementById("content").textContent = "Missing article id."; return; }
  const snap = await getDoc(doc(db, "news", articleId));
  if (!snap.exists()) { document.getElementById("content").textContent = "Article not found."; return; }

  const data = snap.data();
  document.getElementById("title").textContent = data.title || "Untitled";
  document.getElementById("date").textContent  = formatTimestamp(data.timestamp);
  document.getElementById("image").src        = data.imageUrl || "https://placehold.co/1200x600?text=No+Image";
  document.getElementById("content").innerHTML = data.content || "";
}

loadArticle().catch(err => {
  console.error(err);
  document.getElementById("content").textContent = "Error loading article.";
});
