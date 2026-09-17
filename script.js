import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyReplaceIfNecessary",
    authDomain: "dahye-delivery.firebaseapp.com",
    projectId: "dahye-delivery",
    storageBucket: "dahye-delivery.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global State Variables
let currentRestaurant = null;
let currentCategory = null;
let navigationHistory = [];

// 2. Navigation Functions
function navigateTo(pageId, pushToHistory = true) {
    const pages = document.querySelectorAll('.view-page');
    const targetPage = document.getElementById(pageId);

    if (!targetPage) return;

    if (pushToHistory) {
        const activePage = document.querySelector('.view-page.active');
        if (activePage && activePage.id !== pageId) {
            navigationHistory.push(activePage.id);
        }
    }

    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    targetPage.classList.add('active');
    targetPage.style.display = 'block';
    window.scrollTo(0, 0);

    // Header visibility logic matching HTML elements
    const logoSection = document.getElementById('defaultLogoSection');
    const catHeader = document.getElementById('categoriesHeaderSection');
    const backBtn = document.getElementById('backBtn');

    if (pageId === 'pageHome') {
        if (logoSection) logoSection.style.display = 'flex';
        if (catHeader) catHeader.style.display = 'none';
        if (backBtn) backBtn.style.display = 'none';
    } else {
        if (logoSection) logoSection.style.display = 'none';
        if (catHeader) catHeader.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'flex';
    }
}

function goBack() {
    if (navigationHistory.length > 0) {
        const previousPage = navigationHistory.pop();
        navigateTo(previousPage, false);
    } else {
        navigateTo('pageHome', false);
    }
}

function openCategories() {
    navigateTo('pageCategories');
    renderUserCategories();
}

function openRestaurants(categoryName) {
    currentCategory = categoryName;
    const heroTitle = document.getElementById('categoryHeroTitle');
    if (heroTitle) heroTitle.textContent = categoryName;
    navigateTo('pageRestaurants');
    renderUserRestaurants(categoryName);
}

// 3. User Data Rendering (Firebase Fetching)
async function renderUserCategories() {
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-text">جاري تحميل الأقسام...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        grid.innerHTML = '';
        
        if (querySnapshot.empty) {
            grid.innerHTML = '<p class="empty-text">لا توجد أقسام حالياً.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const name = data.nameAr || data.name || '';
            const img = data.image || data.img || 'https://via.placeholder.com/150';
            
            const card = document.createElement('div');
            card.className = 'category-card';
            card.onclick = () => openRestaurants(name);
            card.innerHTML = `
                <img src="${img}" alt="${name}">
                <h3>${name}</h3>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        grid.innerHTML = '<p class="error-text">حدث خطأ أثناء تحميل الأقسام.</p>';
    }
}

async function renderUserRestaurants(categoryName) {
    const grid = document.getElementById('restaurantsListContainer');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-text">جاري تحميل المطاعم...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        grid.innerHTML = '';

        let count = 0;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!categoryName || data.category === categoryName) {
                count++;
                const card = document.createElement('div');
                card.className = 'restaurant-card';
                card.onclick = () => openRestaurantDetails(data);
                card.innerHTML = `
                    <img src="${data.logo || data.image || 'https://via.placeholder.com/300'}" alt="${data.name}">
                    <div class="restaurant-info">
                        <h3>${data.name}</h3>
                        <p>${data.desc || data.description || ''}</p>
                    </div>
                `;
                grid.appendChild(card);
            }
        });

        if (count === 0) {
            grid.innerHTML = '<p class="empty-text">لا توجد مطاعم متوفرة في هذا القسم.</p>';
        }
    } catch (error) {
        console.error("Error loading restaurants:", error);
        grid.innerHTML = '<p class="error-text">حدث خطأ أثناء تحميل المطاعم.</p>';
    }
}

function openRestaurantDetails(data) {
    currentRestaurant = data;
    const nameElem = document.getElementById('profileName');
    const imgElem = document.getElementById('profileLogo');
    const descElem = document.getElementById('profileDesc');
    const menuBtn = document.getElementById('profileMenuBtn');
    const contactBtn = document.getElementById('profileContactBtn');
    const locationBtn = document.getElementById('profileLocationBtn');

    if (nameElem) nameElem.textContent = data.name || '';
    if (imgElem) imgElem.src = data.logo || data.image || 'https://via.placeholder.com/300';
    if (descElem) descElem.textContent = data.desc || data.description || '';

    if (menuBtn) menuBtn.href = data.menu || '#';
    if (contactBtn) contactBtn.href = data.phone ? `https://wa.me/${data.phone}` : '#';
    if (locationBtn) locationBtn.href = data.map || '#';

    navigateTo('pageRestProfile');
}

// 4. Admin Management & Dropdown Update
function checkAdminAccess() {
    navigateTo('pageLogin');
}

function performAdminLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (passInput && passInput.value === "123456") {
        navigateTo('pageAdmin');
        loadAdminCategories();
        loadAdminRestaurants();
        if (passInput) passInput.value = '';
    } else {
        alert("كلمة المرور غير صحيحة!");
    }
}

function logoutAdmin() {
    navigateTo('pageHome');
}

function updateAdminCategoryDropdown(categories) {
    const select = document.getElementById('adminCategory');
    if (!select) return;
    
    let optionsHTML = '<option value="">اختر القسم...</option>';
    categories.forEach(cat => {
        const catName = cat.nameAr || cat.name || '';
        optionsHTML += `<option value="${catName}">${catName}</option>`;
    });
    
    select.innerHTML = optionsHTML;
}

async function saveCategoryToFirebase() {
    const nameArInput = document.getElementById('adminCatAr');
    const nameEnInput = document.getElementById('adminCatEn');
    const imgInput = document.getElementById('adminCatImg');

    if (!nameArInput || !nameArInput.value.trim()) {
        alert("يرجى إدخال اسم القسم بالعربي");
        return;
    }

    try {
        await addDoc(collection(db, "categories"), {
            nameAr: nameArInput.value.trim(),
            nameEn: nameEnInput ? nameEnInput.value.trim() : '',
            image: imgInput ? imgInput.value.trim() : ''
        });
        alert("تمت إضافة القسم بنجاح!");
        resetCategoryForm();
        loadAdminCategories();
    } catch (error) {
        console.error("Error adding category:", error);
        alert("حدث خطأ أثناء إضافة القسم");
    }
}

function resetCategoryForm() {
    const inputs = ['adminCatAr', 'adminCatEn', 'adminCatImg', 'editCatDocId'];
    inputs.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
}

async function loadAdminCategories() {
    const container = document.getElementById('adminManageCategoriesContainer');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        container.innerHTML = '';
        let categories = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            categories.push({ id, ...data });

            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <span>${data.nameAr || data.name}</span>
                <button onclick="deleteCategoryFromFirebase('${id}')">حذف</button>
            `;
            container.appendChild(item);
        });

        // تحديث القائمة المنسدلة للـ HTML
        updateAdminCategoryDropdown(categories);
    } catch (error) {
        console.error("Error loading admin categories:", error);
    }
}

async function deleteCategoryFromFirebase(id) {
    if (confirm("هل أنت تأكد من حذف هذا القسم؟")) {
        try {
            await deleteDoc(doc(db, "categories", id));
            loadAdminCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    }
}

async function saveRestaurantToFirebase() {
    const name = document.getElementById('adminName')?.value.trim();
    const category = document.getElementById('adminCategory')?.value;
    const desc = document.getElementById('adminDesc')?.value.trim();
    const logo = document.getElementById('adminLogo')?.value.trim();
    const phone = document.getElementById('adminPhone')?.value.trim();
    const menu = document.getElementById('adminMenu')?.value.trim();
    const map = document.getElementById('adminMap')?.value.trim();

    if (!name || !category) {
        alert("يرجى ملء اسم المطعم واختيار القسم!");
        return;
    }

    try {
        await addDoc(collection(db, "restaurants"), {
            name,
            category,
            desc,
            logo,
            phone,
            menu,
            map
        });
        alert("تمت إضافة المطعم بنجاح!");
        resetAdminForm();
        loadAdminRestaurants();
    } catch (error) {
        console.error("Error saving restaurant:", error);
        alert("حدث خطأ أثناء حفظ المطعم");
    }
}

function resetAdminForm() {
    const inputs = ['adminName', 'adminDesc', 'adminLogo', 'adminGallery', 'adminPhone', 'adminMenu', 'adminMap', 'editDocId'];
    inputs.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    const select = document.getElementById('adminCategory');
    if (select) select.value = '';
}

async function loadAdminRestaurants() {
    const container = document.getElementById('adminManageListContainer');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        container.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div>
                    <strong>${data.name}</strong> (${data.category})
                </div>
                <button onclick="deleteRestaurantFromFirebase('${id}')">حذف</button>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading admin restaurants:", error);
    }
}

async function deleteRestaurantFromFirebase(id) {
    if (confirm("هل أنت تأكد من حذف هذا المطعم؟")) {
        try {
            await deleteDoc(doc(db, "restaurants", id));
            loadAdminRestaurants();
        } catch (error) {
            console.error("Error deleting restaurant:", error);
        }
    }
}

// 5. Search / Filter Functions
function filterCategories() {
    const input = document.getElementById('categoriesSearchInput');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('#categoriesGridContainer .category-card');

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(filter) ? 'block' : 'none';
    });
}

function filterRestaurants() {
    const input = document.getElementById('restaurantsSearchInput');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('#restaurantsListContainer .restaurant-card');

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(filter) ? 'block' : 'none';
    });
}

// 6. Global Exports (ربط مباشر للـ HTML)
window.navigateTo = navigateTo;
window.goBack = goBack;
window.openCategories = openCategories;
window.openRestaurants = openRestaurants;
window.checkAdminAccess = checkAdminAccess;
window.performAdminLogin = performAdminLogin;
window.logoutAdmin = logoutAdmin;
window.saveCategoryToFirebase = saveCategoryToFirebase;
window.resetCategoryForm = resetCategoryForm;
window.deleteCategoryFromFirebase = deleteCategoryFromFirebase;
window.saveRestaurantToFirebase = saveRestaurantToFirebase;
window.resetAdminForm = resetAdminForm;
window.deleteRestaurantFromFirebase = deleteRestaurantFromFirebase;
window.filterCategories = filterCategories;
window.filterRestaurants = filterRestaurants;

// Auto-bind Event Listener for Region Card
document.addEventListener('DOMContentLoaded', () => {
    const regionCard = document.querySelector('.region-card');
    if (regionCard) {
        regionCard.addEventListener('click', () => {
            openCategories();
        });
    }
});
