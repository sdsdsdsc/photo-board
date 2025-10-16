import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

import { 
  getFirestore, collection, addDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// ✅ Make sure Firebase app is ready
let app;
try {
  app = getApp();
} catch {
  // If not initialized yet, wait a bit
  await new Promise(res => setTimeout(res, 500));
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);

// Get elements
const fileInput = document.getElementById("fileInput");
const messageInput = document.getElementById("messageInput");
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

// Upload handler
uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const message = messageInput.value.trim();

  if (!file || !message) {
    alert("Please add a photo and a message!");
    return;
  }

  try {
    // 1️⃣ Upload the image to Firebase Storage
    const storageRef = ref(storage, "uploads/" + file.name);
    await uploadBytes(storageRef, file);
    const imageURL = await getDownloadURL(storageRef);

    // 2️⃣ Save message + imageURL to Firestore
    await addDoc(collection(db, "posts"), {
      message,
      imageURL,
      createdAt: new Date()
    });

    alert("Upload successful!");
    messageInput.value = "";
    fileInput.value = "";

    // 3️⃣ Reload the gallery
    loadGallery();
  } catch (err) {
    console.error(err);
    alert("Error uploading file: " + err.message);
  }
});

// Load gallery from Firestore
async function loadGallery() {
  gallery.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "posts"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const item = document.createElement("div");
    item.classList.add("post");
    item.innerHTML = `
      <img src="${data.imageURL}" alt="photo" />
      <p>${data.message}</p>
    `;
    gallery.appendChild(item);
  });
}

// Load posts on page open
loadGallery();
