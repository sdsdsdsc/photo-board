import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSlzsjq26_yFu7Hi1x6j8R4Yt7uqpARDw",
  authDomain: "alex-photo-board.firebaseapp.com",
  projectId: "alex-photo-board",
  storageBucket: "alex-photo-board.appspot.com",
  messagingSenderId: "1092938868533",
  appId: "1:1092938868533:web:7df0a0832310c2d30d8e7c",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== PHOTO UPLOAD ==========
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const msgInput = document.getElementById("msgInput");
const nameInput = document.getElementById("nameInput");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("postModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close");

async function uploadImage(file) {
  const cloudName = "dburezmgp";
  const uploadPreset = "unsigned_upload";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
}

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const name = nameInput.value.trim() || "Anonymous";
  const msg = msgInput.value.trim();
  if (!file || !msg) return alert("Please choose a file and write a message!");

  try {
    const imageUrl = await uploadImage(file);
    await addDoc(collection(db, "posts"), {
      name,
      message: msg,
      imageUrl,
      likes: 0,
      createdAt: serverTimestamp()
    });
    fileInput.value = "";
    msgInput.value = "";
    nameInput.value = "";
    alert("Uploaded!");
    loadGallery();
  } catch (err) {
    console.error("Upload error:", err);
  }
});

async function loadGallery() {
  gallery.innerHTML = "";
  const snapshot = await getDocs(collection(db, "posts"));
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const postId = docSnap.id;
    const item = document.createElement("div");
    item.classList.add("item");

    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = data.message;
    const username = document.createElement("h4");
    username.textContent = data.name || "Anonymous";
    const caption = document.createElement("p");
    caption.textContent = data.message || "";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View Details";
    viewBtn.classList.add("view-btn");
    viewBtn.addEventListener("click", () => openModal(postId));

    item.appendChild(img);
    item.appendChild(username);
    item.appendChild(caption);
    item.appendChild(viewBtn);
    gallery.appendChild(item);
  }
}

async function openModal(postId) {
  modal.style.display = "block";
  modalBody.innerHTML = "";
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  const data = postSnap.data();

  const img = document.createElement("img");
  img.src = data.imageUrl;
  img.classList.add("modal-image");
  const name = document.createElement("h3");
  name.textContent = data.name;
  const msg = document.createElement("p");
  msg.textContent = data.message;

  const time = document.createElement("p");
  if (data.createdAt && data.createdAt.toDate) {
    const date = data.createdAt.toDate();
    time.textContent = `🕓 Posted on ${date.toLocaleString()}`;
    time.classList.add("time");
  }

  const likeBtn = document.createElement("button");
  likeBtn.textContent = `❤️ ${data.likes || 0}`;
  likeBtn.classList.add("like-btn");
  likeBtn.addEventListener("click", async () => {
    const newLikes = (data.likes || 0) + 1;
    await updateDoc(postRef, { likes: newLikes });
    data.likes = newLikes;
    likeBtn.textContent = `❤️ ${newLikes}`;
  });

  modalBody.appendChild(img);
  modalBody.appendChild(name);
  modalBody.appendChild(msg);
  modalBody.appendChild(time);
  modalBody.appendChild(likeBtn);
}

closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// ========== NEWS ==========
async function loadNews() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = "";
  const snapshot = await getDocs(collection(db, "news"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const item = document.createElement("div");
    item.classList.add("news-card");

    const title = document.createElement("h3");
    title.textContent = data.title;
    title.classList.add("news-title");
    title.addEventListener("click", () => {
      window.location.href = `article.html?id=${id}`;
    });

    const img = document.createElement("img");
    img.src = data.imageUrl;
    img.alt = data.title;
    img.classList.add("news-thumb");

    const time = document.createElement("p");
    if (data.createdAt && data.createdAt.toDate) {
      const date = data.createdAt.toDate();
      time.textContent = `🕓 ${date.toLocaleString()}`;
      time.classList.add("time");
    }

    const likeBtn = document.createElement("button");
    likeBtn.textContent = `👍 ${data.likes || 0}`;
    likeBtn.classList.add("like-btn");
    likeBtn.addEventListener("click", async () => {
      const postRef = doc(db, "news", id);
      const newLikes = (data.likes || 0) + 1;
      await updateDoc(postRef, { likes: newLikes });
      data.likes = newLikes;
      likeBtn.textContent = `👍 ${newLikes}`;
    });

    item.appendChild(title);
    item.appendChild(img);
    item.appendChild(time);
    item.appendChild(likeBtn);
    container.appendChild(item);
  });
}

// ========== MENU ==========
const photoMenu = document.getElementById("photoMenu");
const newsMenu = document.getElementById("newsMenu");
const photoSection = document.getElementById("photoSection");
const newsSection = document.getElementById("newsSection");

photoMenu.addEventListener("click", () => {
  photoSection.style.display = "block";
  newsSection.style.display = "none";
  photoMenu.classList.add("active");
  newsMenu.classList.remove("active");
});
newsMenu.addEventListener("click", () => {
  photoSection.style.display = "none";
  newsSection.style.display = "block";
  newsMenu.classList.add("active");
  photoMenu.classList.remove("active");
  loadNews();
});

loadGallery();
