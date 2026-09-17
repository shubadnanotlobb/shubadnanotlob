import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDj5Cp_Fw8zRcCJGCPQ6F0_A6vLp98NNfU",
  authDomain: "shubadnanotlob-b5ff3.firebaseapp.com",
  projectId: "shubadnanotlob-b5ff3",
  storageBucket: "shubadnanotlob-b5ff3.firebasestorage.app",
  messagingSenderId: "549895905471",
  appId: "1:549895905471:web:5edaf449f3a4021e97e60a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentView = 'home';
let navigationHistory = [];
let currentRestaurantsList = [];
let currentCategoriesList = [];
let currentHeroImage = '';
let adminClickCount = 0;
let adminClickTimer = null;
let isAuthenticated = false;

onAuthStateChanged(auth, (user) => {
  isAuthenticated = !!user;
});

function checkAdminAccess() {
  adminClickCount++;
  clearTimeout(adminClickTimer);
  adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 1200);

  if (adminClickCount >= 6) {
    adminClickCount = 0;
    if (isAuthenticated || auth.currentUser) {
      renderAdminManageCategories();
      renderAdminManageList();
      populateCategoryDropdown();
      navigateTo('pageAdmin');
    } else {
      navigateTo('pageLogin');
    }
  }
}

function performAdminLogin() {
  let email = document.getElementById('loginEmail').value.trim();
  let password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';
      renderAdminManageCategories();
      renderAdminManageList();
      populateCategoryDropdown();
      navigateTo('pageAdmin');
    })
    .catch(err => alert("Access Denied: " + err.message));
}

function logoutAdmin() {
  signOut(auth).then(() => {
    resetAdminForm();
    resetCategoryForm();
    navigateTo('pageHome');
  });
}

/* ==================== CATEGORY MANAGEMENT ==================== */

async function fetchCategoriesFromFirebase() {
  try {
    let snapshot = await getDocs(collection(db, 'categories'));
    currentCategoriesList = [];
    snapshot.forEach(docSnap => {
      let data = docSnap.data();
      data.id = docSnap.id;
      currentCategoriesList.push(data);
    });
    currentCategoriesList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return currentCategoriesList;
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}

async function renderUserCategories() {
  const container = document.getElementById('categoriesGridContainer');
  if (!container) return;
  container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #777; font-size: 13px; padding: 30px;">جاري تحميل الأقسام...</p>';

  let categories = await fetchCategoriesFromFirebase();

  let restSnapshot = await getDocs(collection(db, 'restaurants'));
  let allRestaurants = [];
  restSnapshot.forEach(docSnap => allRestaurants.push(docSnap.data()));

  container.innerHTML = '';

  if (categories.length === 0) {
    container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #777; font-size: 13px; padding: 30px;">لا توجد أقسام متوفرة حالياً</p>';
    return;
  }

  categories.forEach(cat => {
    let count = allRestaurants.filter(r => r.category === cat.titleAr).length;

    container.innerHTML += `
      <div class="category-card" data-ar="${cat.titleAr}" data-en="${cat.titleEn}" onclick="openRestaurants('${cat.titleAr}', '${cat.titleEn}', '${cat.imgUrl}')">
        <img class="cat-img" src="${cat.imgUrl}" alt="${cat.titleAr}" onerror="this.src='assets/logo.png'">
        <div class="cat-info">
          <div class="cat-title-ar">${cat.titleAr}</div>
          <div class="cat-title-en">${cat.titleEn} • <span style="color: var(--primary-teal, #0f4c5c); font-weight: bold;">(${count})</span></div>
        </div>
        <div class="cat-arrow">&lsaquo;</div>
      </div>`;
  });
}

async function saveCategoryToFirebase() {
  if (!isAuthenticated && !auth.currentUser) {
    alert("Unauthorized session! Please log in again.");
    navigateTo('pageLogin');
    return;
  }

  let docId = document.getElementById('editCatDocId').value;
  let titleAr = document.getElementById('adminCatAr').value.trim();
  let titleEn = document.getElementById('adminCatEn').value.trim();
  let imgUrl = document.getElementById('adminCatImg').value.trim();

  if (!titleAr || !titleEn) {
    alert('Please enter Arabic and English titles for the category.');
    return;
  }

  let catData = {
    titleAr,
    titleEn,
    imgUrl: imgUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    updatedAt: serverTimestamp()
  };

  if (!docId) {
    catData.order = currentCategoriesList.length + 1;
  }

  try {
    if (docId) {
      await updateDoc(doc(db, 'categories', docId), catData);
      alert('Category updated successfully!');
    } else {
      await addDoc(collection(db, 'categories'), catData);
      alert('Category added successfully!');
    }
    resetCategoryForm();
    renderAdminManageCategories();
    populateCategoryDropdown();
  } catch (err) {
    alert("Error saving category: " + err.message);
  }
}

function resetCategoryForm() {
  document.getElementById('editCatDocId').value = '';
  document.getElementById('adminCatAr').value = '';
  document.getElementById('adminCatEn').value = '';
  document.getElementById('adminCatImg').value = '';
  document.getElementById('categoryFormTitle').innerText = 'Add / Edit Category';
}

async function renderAdminManageCategories() {
  let container = document.getElementById('adminManageCategoriesContainer');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center; padding:10px; font-size:12px; color:#666;">Loading categories...</p>';

  let categories = await fetchCategoriesFromFirebase();

  let restSnapshot = await getDocs(collection(db, 'restaurants'));
  let allRestaurants = [];
  restSnapshot.forEach(docSnap => allRestaurants.push(docSnap.data()));

  container.innerHTML = '';

  if (categories.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">No categories found.</p>';
    return;
  }

  categories.forEach((cat, index) => {
    let count = allRestaurants.filter(r => r.category === cat.titleAr).length;

    container.innerHTML += `
      <div class="admin-rest-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #eee;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="background:#0f4c5c; color:#fff; padding:3px 8px; border-radius:6px; font-weight:bold; font-size:12px;">#${index + 1}</span>
          <div>
            <strong style="font-size:13px; color:#141414;">${cat.titleAr}</strong><br>
            <small style="color:#0f4c5c; font-weight:700;">${cat.titleEn} (${count})</small>
          </div>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
          <button onclick="moveCategory(${index}, -1)" style="background:#0f4c5c; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">▲</button>
          <button onclick="moveCategory(${index}, 1)" style="background:#0f4c5c; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">▼</button>
          <button onclick="editCategory('${cat.id}')" style="background:#555; color:#fff; border:none; padding:5px 8px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">Edit</button>
          <button onclick="deleteCategory('${cat.id}')" style="background:#d32f2f; color:#fff; border:none; padding:5px 8px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">Delete</button>
        </div>
      </div>`;
  });
}

window.moveCategory = async function(index, direction) {
  let targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= currentCategoriesList.length) return;

  let currentCat = currentCategoriesList[index];
  let targetCat = currentCategoriesList[targetIndex];

  let currentOrder = currentCat.order !== undefined ? Number(currentCat.order) : (index + 1);
  let targetOrder = targetCat.order !== undefined ? Number(targetCat.order) : (targetIndex + 1);

  if (currentOrder === targetOrder) {
    currentOrder = index + 1;
    targetOrder = targetIndex + 1;
  }

  try {
    await updateDoc(doc(db, 'categories', currentCat.id), { order: targetOrder });
    await updateDoc(doc(db, 'categories', targetCat.id), { order: currentOrder });

    renderAdminManageCategories();
  } catch (err) {
    alert("Error updating order: " + err.message);
  }
};

window.editCategory = async function(docId) {
  let docSnap = await getDoc(doc(db, 'categories', docId));
  if (docSnap.exists()) {
    let cat = docSnap.data();
    document.getElementById('editCatDocId').value = docSnap.id;
    document.getElementById('adminCatAr').value = cat.titleAr;
    document.getElementById('adminCatEn').value = cat.titleEn;
    document.getElementById('adminCatImg').value = cat.imgUrl || '';
    document.getElementById('categoryFormTitle').innerText = 'Edit Category';
  }
};

window.deleteCategory = async function(docId) {
  if (confirm('Delete this category permanently?')) {
    await deleteDoc(doc(db, 'categories', docId));
    renderAdminManageCategories();
    populateCategoryDropdown();
  }
};

async function populateCategoryDropdown() {
  let select = document.getElementById('adminCategory');
  if (!select) return;
  select.innerHTML = '<option value="">Loading...</option>';

  let categories = await fetchCategoriesFromFirebase();
  select.innerHTML = '';

  if (categories.length === 0) {
    select.innerHTML = '<option value="">No categories available</option>';
    return;
  }

  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.titleAr}">${cat.titleAr}</option>`;
  });
}

/* ==================== RESTAURANT MANAGEMENT ==================== */

async function saveRestaurantToFirebase() {
  if (!isAuthenticated && !auth.currentUser) {
    alert("Unauthorized session! Please log in again.");
    navigateTo('pageLogin');
    return;
  }

  let docId = document.getElementById('editDocId').value;
  let category = document.getElementById('adminCategory').value;
  let name = document.getElementById('adminName').value.trim();
  let desc = document.getElementById('adminDesc').value.trim();
  let logo = document.getElementById('adminLogo').value.trim();
  let galleryRaw = document.getElementById('adminGallery') ? document.getElementById('adminGallery').value.trim() : '';
  let phone = document.getElementById('adminPhone').value.trim();
  let menuUrl = document.getElementById('adminMenu').value.trim();
  let mapUrl = document.getElementById('adminMap').value.trim();

  if (!name) { alert('Please enter restaurant name'); return; }

  let gallery = galleryRaw ? galleryRaw.split(',').map(item => item.trim()).filter(Boolean) : [];

  let restData = {
    category,
    name,
    desc: desc || 'Delicious Food',
    logo: logo || '',
    gallery: gallery,
    phone: phone || '96170725668',
    menuUrl: menuUrl || '#',
    mapUrl: mapUrl || 'https://maps.google.com',
    updatedAt: serverTimestamp()
  };

  try {
    if (docId) {
      await updateDoc(doc(db, 'restaurants', docId), restData);
      alert('Restaurant updated successfully!');
    } else {
      await addDoc(collection(db, 'restaurants'), restData);
      alert('Restaurant saved successfully!');
    }
    resetAdminForm();
    renderAdminManageList();
  } catch (err) {
    alert("Error saving: " + err.message);
  }
}

function resetAdminForm() {
  document.getElementById('editDocId').value = '';
  document.getElementById('adminName').value = '';
  document.getElementById('adminDesc').value = '';
  document.getElementById('adminLogo').value = '';
  if (document.getElementById('adminGallery')) document.getElementById('adminGallery').value = '';
  document.getElementById('adminPhone').value = '';
  document.getElementById('adminMenu').value = '';
  document.getElementById('adminMap').value = '';
  document.getElementById('formTitle').innerText = 'Add New Restaurant';
}

async function renderAdminManageList() {
  let container = document.getElementById('adminManageListContainer');
  if (!container) return;
  container.innerHTML = '<p style="text-align:center; padding:10px; font-size:12px; color:#666;">Loading servers...</p>';

  try {
    let snapshot = await getDocs(collection(db, 'restaurants'));
    container.innerHTML = '';
    if (snapshot.empty) {
      container.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">No restaurants found in database.</p>';
      return;
    }
    snapshot.forEach(docSnap => {
      let rest = docSnap.data();
      container.innerHTML += `
        <div class="admin-rest-item">
          <div>
            <strong style="font-size:13px; color:#141414;">${rest.name}</strong><br>
            <small style="color:#0f4c5c; font-weight:700;">${rest.category}</small>
          </div>
          <div style="display:flex; gap:6px;">
            <button onclick="editRest('${docSnap.id}')" style="background:#0f4c5c; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">Edit</button>
            <button onclick="deleteRest('${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">Delete</button>
          </div>
        </div>`;
    });
  } catch (err) {
    container.innerHTML = '<p style="text-align:center; color:red; font-size:12px;">Failed to load data</p>';
  }
}

window.editRest = async function(docId) {
  let docSnap = await getDoc(doc(db, 'restaurants', docId));
  if (docSnap.exists()) {
    let rest = docSnap.data();
    document.getElementById('editDocId').value = docSnap.id;
    document.getElementById('adminCategory').value = rest.category;
    document.getElementById('adminName').value = rest.name;
    document.getElementById('adminDesc').value = rest.desc || '';
    document.getElementById('adminLogo').value = rest.logo || '';
    if (document.getElementById('adminGallery')) {
      document.getElementById('adminGallery').value = rest.gallery ? rest.gallery.join(', ') : '';
    }
    document.getElementById('adminPhone').value = rest.phone || '';
    document.getElementById('adminMenu').value = rest.menuUrl || '';
    document.getElementById('adminMap').value = rest.mapUrl || '';
    document.getElementById('formTitle').innerText = 'Edit Restaurant Profile';
  }
};

window.deleteRest = async function(docId) {
  if (confirm('Delete this restaurant permanently from server?')) {
    await deleteDoc(doc(db, 'restaurants', docId));
    renderAdminManageList();
  }
};

/* ==================== NAVIGATION & VIEWS ==================== */

function updateHeaders(pageId) {
  let defaultLogo = document.getElementById('defaultLogoSection');
  let catHeader = document.getElementById('categoriesHeaderSection');
  if (defaultLogo) defaultLogo.style.display = pageId === 'pageCategories' ? 'none' : 'flex';
  if (catHeader) catHeader.style.display = pageId === 'pageCategories' ? 'flex' : 'none';

  let headerTitles = {
    'pageHome': 'خيارك الأفضل دائماً',
    'pageCategories': 'الأقسام المتاحة',
    'pageRestaurants': 'قائمة المطاعم',
    'pageRestProfile': 'تفاصيل المطعم',
    'pageLogin': 'بوابة الإدارة',
    'pageAdmin': 'لوحة التحكم النشطة'
  };
  let headerText = document.getElementById('headerTitleText');
  if (headerText) headerText.innerText = headerTitles[pageId] || 'Shu Badna Notlob';
}

function navigateTo(pageId, pushHistory = true) {
  if (pushHistory && currentView !== pageId) navigationHistory.push(currentView);
  document.querySelectorAll('.view-page').forEach(page => page.classList.remove('active'));
  let targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');
  currentView = pageId;
  updateHeaders(pageId);
  let backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.classList.toggle('visible', pageId !== 'pageHome');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCategories() {
  renderUserCategories();
  navigateTo('pageCategories');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function openRestaurants(titleAr, titleEn, heroImageUrl) {
  let heroImg = document.getElementById('categoryHeroImg');
  let heroTitle = document.getElementById('categoryHeroTitle');
  if (heroImg) heroImg.src = heroImageUrl;
  if (heroTitle) heroTitle.innerText = `${titleAr} / ${titleEn}`;
  currentHeroImage = heroImageUrl;

  const container = document.getElementById('restaurantsListContainer');
  if (container) container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #777; font-size: 13px; padding: 30px;">جاري تحميل المطاعم...</p>';
  navigateTo('pageRestaurants');

  try {
    let q = query(collection(db, 'restaurants'), where('category', '==', titleAr));
    let snapshot = await getDocs(q);
    currentRestaurantsList = [];
    snapshot.forEach(docSnap => {
      let data = docSnap.data();
      data.id = docSnap.id;
      currentRestaurantsList.push(data);
    });

    shuffleArray(currentRestaurantsList);
    renderRestaurants(currentRestaurantsList);
  } catch (err) {
    if (container) container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: red; font-size: 13px; padding: 30px;">تعذر تحميل البيانات</p>';
  }
}

function renderRestaurants(list) {
  const container = document.getElementById('restaurantsListContainer');
  if (!container) return;
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #777; font-size: 13px; padding: 30px;">لا توجد مطاعم متوفرة حالياً في هذا التصنيف</p>';
    return;
  }

  const defaultFallbackLogo = 'assets/logo.png';

  list.forEach((rest, index) => {
    const logoSrc = (rest.logo && rest.logo.trim() !== '') ? rest.logo : defaultFallbackLogo;

    container.innerHTML += `
      <div class="restaurant-card" style="cursor: pointer;">
        <div class="rest-top-content" onclick="openRestaurantProfile(${index})">
          <img class="rest-icon" src="${logoSrc}" alt="Logo" onerror="this.onerror=null; this.src='${defaultFallbackLogo}';">
          <div class="rest-info">
            <h4>${rest.name}</h4>
            <p>${rest.desc}</p>
          </div>
        </div>
        <div class="rest-actions">
          <a href="${rest.menuUrl}" target="_blank" class="action-btn btn-menu" onclick="event.stopPropagation();">MENU</a>
          <a href="https://wa.me/${rest.phone}" target="_blank" class="action-btn btn-contact" onclick="event.stopPropagation();">CONTACT</a>
          <a href="${rest.mapUrl}" target="_blank" class="action-btn btn-location" onclick="event.stopPropagation();">LOCATION</a>
        </div>
      </div>`;
  });
}

window.openRestaurantProfile = function(index) {
  const rest = currentRestaurantsList[index];
  if (!rest) return;

  const defaultFallbackLogo = 'assets/logo.png';
  const logoSrc = (rest.logo && rest.logo.trim() !== '') ? rest.logo : defaultFallbackLogo;

  document.getElementById('profileLogo').src = logoSrc;
  document.getElementById('profileName').innerText = rest.name;
  document.getElementById('profileDesc').innerText = rest.desc;

  document.getElementById('profileMenuBtn').href = rest.menuUrl || '#';
  document.getElementById('profileContactBtn').href = `https://wa.me/${rest.phone}`;
  document.getElementById('profileLocationBtn').href = rest.mapUrl || '#';

  const galleryContainer = document.getElementById('profileGalleryContainer');
  galleryContainer.innerHTML = '';

  if (rest.gallery && rest.gallery.length > 0) {
    rest.gallery.forEach(imgUrl => {
      galleryContainer.innerHTML += `<img src="${imgUrl}" alt="Gallery Image" onerror="this.style.display='none'">`;
    });
  } else {
    galleryContainer.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#888; font-size:12px;">لا توجد صور إضافية متوفرة حالياً</p>';
  }

  navigateTo('pageRestProfile');
};

function filterCategories() {
  let queryText = document.getElementById('categoriesSearchInput').value.toLowerCase();
  document.querySelectorAll('#categoriesGridContainer .category-card').forEach(card => {
    let match = card.getAttribute('data-ar').includes(queryText) || card.getAttribute('data-en').toLowerCase().includes(queryText);
    card.style.display = match ? 'flex' : 'none';
  });
}

function filterRestaurants() {
  let queryText = document.getElementById('restaurantsSearchInput').value.toLowerCase();
  let filtered = currentRestaurantsList.filter(r => r.name.toLowerCase().includes(queryText));
  renderRestaurants(filtered);
}

function goBack() {
  if (navigationHistory.length > 0) navigateTo(navigationHistory.pop(), false);
  else navigateTo('pageHome', false);
}

// تصدير الدوال للـ Window لكي تعمل الأحداث onclick من الـ HTML مباشرة
window.checkAdminAccess = checkAdminAccess;
window.performAdminLogin = performAdminLogin;
window.logoutAdmin = logoutAdmin;
window.saveCategoryToFirebase = saveCategoryToFirebase;
window.resetCategoryForm = resetCategoryForm;
window.saveRestaurantToFirebase = saveRestaurantToFirebase;
window.resetAdminForm = resetAdminForm;
window.openCategories = openCategories;
window.openRestaurants = openRestaurants;
window.filterCategories = filterCategories;
window.filterRestaurants = filterRestaurants;
window.goBack = goBack;
// ربط دالة التنقل بالنطاق العام (Global Window Object) لتعمل مع onclick مباشرة
window.openCategories = function() {
    renderUserCategories();
    navigateTo('pageCategories');
};

window.goBack = function() {
    if (navigationHistory.length > 0) {
        navigateTo(navigationHistory.pop(), false);
    } else {
        navigateTo('pageHome', false);
    }
};

window.checkAdminAccess = checkAdminAccess;
window.performAdminLogin = performAdminLogin;
window.logoutAdmin = logoutAdmin;
