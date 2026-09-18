import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentCategoryFilter = "";
let allRestaurants = [];
let allCategories = [];

function showPage(pageId) {
  document.querySelectorAll(".view-page").forEach(page => {
    page.classList.remove("active");
    page.style.display = "none";
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
    targetPage.style.display = "block";
  }

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.style.display = (pageId === "pageHome") ? "none" : "block";
  }

  window.scrollTo(0, 0);
}

function goBack() { showPage("pageHome"); }
function openCategories() { showPage("pageCategories"); }

function resetCategoryForm() {
  const editCatDocId = document.getElementById("editCatDocId");
  const adminCatAr = document.getElementById("adminCatAr");
  const adminCatEn = document.getElementById("adminCatEn");
  const adminCatImg = document.getElementById("adminCatImg");
  const categoryFormTitle = document.getElementById("categoryFormTitle");

  if (editCatDocId) editCatDocId.value = "";
  if (adminCatAr) adminCatAr.value = "";
  if (adminCatEn) adminCatEn.value = "";
  if (adminCatImg) adminCatImg.value = "";
  if (categoryFormTitle) categoryFormTitle.innerText = "Add / Edit Category";
}

async function saveCategoryToFirebase() {
  const docId = document.getElementById("editCatDocId")?.value;
  const nameAr = document.getElementById("adminCatAr")?.value.trim();
  const nameEn = document.getElementById("adminCatEn")?.value.trim();
  const imgUrl = document.getElementById("adminCatImg")?.value.trim();

  if (!nameAr || !nameEn) {
    alert("يرجى إدخال اسم القسم بالعربي والإنجليزي");
    return;
  }

  try {
    if (docId) {
      await updateDoc(doc(db, "categories", docId), { nameAr, nameEn, imgUrl });
      alert("تم تعديل القسم بنجاح!");
    } else {
      await addDoc(collection(db, "categories"), {
        nameAr,
        nameEn,
        imgUrl,
        createdAt: new Date()
      });
      alert("تم إضافة القسم بنجاح!");
    }
    resetCategoryForm();
  } catch (error) {
    console.error("Error saving category: ", error);
    alert("حدث خطأ أثناء حفظ القسم");
  }
}

function editCategory(id, nameAr, nameEn, imgUrl) {
  const editCatDocId = document.getElementById("editCatDocId");
  const adminCatAr = document.getElementById("adminCatAr");
  const adminCatEn = document.getElementById("adminCatEn");
  const adminCatImg = document.getElementById("adminCatImg");
  const categoryFormTitle = document.getElementById("categoryFormTitle");

  if (editCatDocId) editCatDocId.value = id;
  if (adminCatAr) adminCatAr.value = nameAr || "";
  if (adminCatEn) adminCatEn.value = nameEn || "";
  if (adminCatImg) adminCatImg.value = imgUrl || "";
  if (categoryFormTitle) categoryFormTitle.innerText = "Edit Category";
}

async function deleteCategoryFromFirebase(id) {
  if (confirm("هل أنت تأكد من حذف هذا القسم؟")) {
    try {
      await deleteDoc(doc(db, "categories", id));
      alert("تم حذف القسم بنجاح");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  }
}

function resetAdminForm() {
  const editDocId = document.getElementById("editDocId");
  const adminCategory = document.getElementById("adminCategory");
  const adminName = document.getElementById("adminName");
  const adminDesc = document.getElementById("adminDesc");
  const adminLogo = document.getElementById("adminLogo");
  const adminGallery = document.getElementById("adminGallery");
  const adminPhone = document.getElementById("adminPhone");
  const adminMenu = document.getElementById("adminMenu");
  const adminMap = document.getElementById("adminMap");
  const formTitle = document.getElementById("formTitle");

  if (editDocId) editDocId.value = "";
  if (adminCategory) adminCategory.value = "";
  if (adminName) adminName.value = "";
  if (adminDesc) adminDesc.value = "";
  if (adminLogo) adminLogo.value = "";
  if (adminGallery) adminGallery.value = "";
  if (adminPhone) adminPhone.value = "";
  if (adminMenu) adminMenu.value = "";
  if (adminMap) adminMap.value = "";
  if (formTitle) formTitle.innerText = "Add New Restaurant";
}

async function saveRestaurantToFirebase() {
  const docId = document.getElementById("editDocId")?.value;
  const category = document.getElementById("adminCategory")?.value;
  const name = document.getElementById("adminName")?.value.trim();
  const desc = document.getElementById("adminDesc")?.value.trim();
  const logo = document.getElementById("adminLogo")?.value.trim();
  const galleryRaw = document.getElementById("adminGallery")?.value.trim();
  const phone = document.getElementById("adminPhone")?.value.trim();
  const menu = document.getElementById("adminMenu")?.value.trim();
  const map = document.getElementById("adminMap")?.value.trim();

  if (!name || !category) {
    alert("يرجى كتابة اسم المطعم واختيار القسم على الأقل");
    return;
  }

  const galleryArray = galleryRaw ? galleryRaw.split(",").map(item => item.trim()).filter(Boolean) : [];
  const restaurantData = {
    category,
    name,
    desc,
    logo,
    gallery: galleryArray,
    phone,
    menu,
    map,
    updatedAt: new Date()
  };

  try {
    if (docId) {
      await updateDoc(doc(db, "restaurants", docId), restaurantData);
      alert("تم تحديث بيانات المطعم بنجاح!");
    } else {
      restaurantData.createdAt = new Date();
      await addDoc(collection(db, "restaurants"), restaurantData);
      alert("تم حفظ المطعم بنجاح!");
    }
    resetAdminForm();
  } catch (error) {
    console.error("Error saving restaurant: ", error);
    alert("حدث خطأ أثناء حفظ المطعم");
  }
}

async function deleteRestaurantFromFirebase(id) {
  if (confirm("هل أنت متأكد من حذف هذا المطعم؟")) {
    try {
      await deleteDoc(doc(db, "restaurants", id));
      alert("تم الحذف بنجاح");
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  }
}

function checkAdminAccess() {
  const isAdmin = sessionStorage.getItem("isAdminLoggedIn");
  if (isAdmin === "true") {
    showPage("pageAdmin");
  } else {
    if (document.getElementById("loginUsername")) document.getElementById("loginUsername").value = "";
    if (document.getElementById("loginPassword")) document.getElementById("loginPassword").value = "";
    showPage("pageLogin");
  }
}

function performAdminLogin() {
  const user = document.getElementById("loginUsername")?.value;
  const pass = document.getElementById("loginPassword")?.value;

  if (user === "admin" && pass === "123456") {
    sessionStorage.setItem("isAdminLoggedIn", "true");
    showPage("pageAdmin");
  } else {
    alert("اسم المستخدم أو كلمة المرور غير صحيحة");
  }
}

function logoutAdmin() {
  sessionStorage.removeItem("isAdminLoggedIn");
  showPage("pageHome");
}

function filterCategories() {
  const queryStr = document.getElementById("categoriesSearchInput")?.value.toLowerCase().trim();
  const grid = document.getElementById("categoriesGridContainer");
  if (!grid) return;

  grid.innerHTML = "";
  const filtered = allCategories.filter(c =>
    (c.nameAr && c.nameAr.toLowerCase().includes(queryStr)) ||
    (c.nameEn && c.nameEn.toLowerCase().includes(queryStr))
  );

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">لا توجد أقسام مطابقة للبحث.</p>';
    return;
  }

  filtered.forEach(data => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.onclick = () => openRestaurantsByCategory(data.id, data.nameAr || data.nameEn, data.imgUrl);
    card.innerHTML = `
      <img src="${data.imgUrl || "https://via.placeholder.com/150"}" alt="${data.nameAr}">
      <div class="category-title">${data.nameAr}</div>
    `;
    grid.appendChild(card);
  });
}

function filterRestaurants() {
  const queryStr = document.getElementById("restaurantsSearchInput")?.value.toLowerCase().trim();
  renderRestaurantsList(queryStr);
}

function openRestaurantsByCategory(catId, catName, catImg) {
  currentCategoryFilter = catId;

  const heroTitle = document.getElementById("categoryHeroTitle");
  const heroImg = document.getElementById("categoryHeroImg");
  if (heroTitle) heroTitle.innerText = catName;
  if (heroImg) heroImg.src = catImg || "https://via.placeholder.com/400x150";

  renderRestaurantsList();
  showPage("pageRestaurants");
}

function renderRestaurantsList(searchQuery = "") {
  const container = document.getElementById("restaurantsListContainer");
  if (!container) return;
  container.innerHTML = "";

  let filtered = allRestaurants.filter(r => r.category === currentCategoryFilter);

  if (searchQuery) {
    filtered = filtered.filter(r => r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">لا توجد مطاعم حالياً.</p>';
    return;
  }

  filtered.forEach(r => {
    const card = document.createElement("div");
    card.className = "restaurant-card";
    card.onclick = () => openRestaurantProfile(r);
    card.innerHTML = `
      <img src="${r.logo || "https://via.placeholder.com/100"}" alt="${r.name}">
      <div class="restaurant-info">
        <h3>${r.name}</h3>
        <p>${r.desc || ""}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function openRestaurantProfile(r) {
  const profileLogo = document.getElementById("profileLogo");
  const profileName = document.getElementById("profileName");
  const profileDesc = document.getElementById("profileDesc");
  const profileGallery = document.getElementById("profileGalleryContainer");
  const menuBtn = document.getElementById("profileMenuBtn");
  const contactBtn = document.getElementById("profileContactBtn");
  const locationBtn = document.getElementById("profileLocationBtn");

  if (profileLogo) profileLogo.src = r.logo || "https://via.placeholder.com/100";
  if (profileName) profileName.innerText = r.name || "";
  if (profileDesc) profileDesc.innerText = r.desc || "";

  if (menuBtn) menuBtn.href = r.menu || "#";
  if (contactBtn) contactBtn.href = r.phone ? `https://wa.me/${r.phone}` : "#";
  if (locationBtn) locationBtn.href = r.map || "#";

  if (profileGallery) {
    profileGallery.innerHTML = "";
    if (r.gallery && r.gallery.length > 0) {
      r.gallery.forEach(imgUrl => {
        if (imgUrl) {
          const img = document.createElement("img");
          img.src = imgUrl;
          profileGallery.appendChild(img);
        }
      });
    }
  }

  showPage("pageRestProfile");
}

function listenToCategories() {
  try {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
      allCategories = [];
      const adminCatContainer = document.getElementById("adminManageCategoriesContainer");
      const selectDropdown = document.getElementById("adminCategory");

      if (adminCatContainer) adminCatContainer.innerHTML = "";
      if (selectDropdown) selectDropdown.innerHTML = '<option value="">اختر القسم...</option>';

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        allCategories.push({ id, ...data });

        if (selectDropdown) {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = data.nameAr || data.nameEn;
          selectDropdown.appendChild(option);
        }

        if (adminCatContainer) {
          const item = document.createElement("div");
          item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
          item.innerHTML = `
            <span>${data.nameAr} (${data.nameEn})</span>
            <div>
              <button type="button" style="padding: 4px 8px; background: #008080; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.editCategory('${id}', '${data.nameAr}', '${data.nameEn}', '${data.imgUrl || ""}')">تعديل</button>
              <button type="button" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteCategoryFromFirebase('${id}')">حذف</button>
            </div>
          `;
          adminCatContainer.appendChild(item);
        }
      });
      filterCategories();
    });
  } catch (e) {
    console.error(e);
  }
}

function listenToRestaurants() {
  try {
    const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
      allRestaurants = [];
      const adminRestContainer = document.getElementById("adminManageListContainer");
      if (adminRestContainer) adminRestContainer.innerHTML = "";

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        allRestaurants.push({ id, ...data });

        if (adminRestContainer) {
          const item = document.createElement("div");
          item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
          item.innerHTML = `
            <span>${data.name}</span>
            <div>
              <button type="button" style="padding: 4px 8px; background: #008080; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.editRestaurant({ id: '${id}', category: '${data.category || ""}', name: '${data.name || ""}', desc: '${data.desc || ""}', logo: '${data.logo || ""}', gallery: ${JSON.stringify(data.gallery || [])}, phone: '${data.phone || ""}', menu: '${data.menu || ""}', map: '${data.map || ""}' })">تعديل</button>
              <button type="button" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteRestaurantFromFirebase('${id}')">حذف</button>
            </div>
          `;
          adminRestContainer.appendChild(item);
        }
      });

      if (currentCategoryFilter) renderRestaurantsList();
    });
  } catch (e) {
    console.error(e);
  }
}

function editRestaurant(restaurant) {
  const editDocId = document.getElementById("editDocId");
  const adminCategory = document.getElementById("adminCategory");
  const adminName = document.getElementById("adminName");
  const adminDesc = document.getElementById("adminDesc");
  const adminLogo = document.getElementById("adminLogo");
  const adminGallery = document.getElementById("adminGallery");
  const adminPhone = document.getElementById("adminPhone");
  const adminMenu = document.getElementById("adminMenu");
  const adminMap = document.getElementById("adminMap");

  if (editDocId) editDocId.value = restaurant.id;
  if (adminCategory) adminCategory.value = restaurant.category || "";
  if (adminName) adminName.value = restaurant.name || "";
  if (adminDesc) adminDesc.value = restaurant.desc || "";
  if (adminLogo) adminLogo.value = restaurant.logo || "";
  if (adminGallery) adminGallery.value = Array.isArray(restaurant.gallery) ? restaurant.gallery.join(", ") : "";
  if (adminPhone) adminPhone.value = restaurant.phone || "";
  if (adminMenu) adminMenu.value = restaurant.menu || "";
  if (adminMap) adminMap.value = restaurant.map || "";
}

document.addEventListener("DOMContentLoaded", () => {
  listenToCategories();
  listenToRestaurants();
});

window.showPage = showPage;
window.goBack = goBack;
window.openCategories = openCategories;
window.resetCategoryForm = resetCategoryForm;
window.saveCategoryToFirebase = saveCategoryToFirebase;
window.editCategory = editCategory;
window.deleteCategoryFromFirebase = deleteCategoryFromFirebase;
window.resetAdminForm = resetAdminForm;
window.saveRestaurantToFirebase = saveRestaurantToFirebase;
window.deleteRestaurantFromFirebase = deleteRestaurantFromFirebase;
window.checkAdminAccess = checkAdminAccess;
window.performAdminLogin = performAdminLogin;
window.logoutAdmin = logoutAdmin;
window.filterCategories = filterCategories;
window.filterRestaurants = filterRestaurants;
window.openRestaurantsByCategory = openRestaurantsByCategory;
window.openRestaurantProfile = openRestaurantProfile;
window.editRestaurant = editRestaurant;
