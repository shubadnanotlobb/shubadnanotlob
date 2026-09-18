import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyReplaceIfNecessary",
    authDomain: "dahye-delivery.firebaseapp.com",
    projectId: "dahye-delivery",
    storageBucket: "dahye-delivery.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let navigationHistory = [];

// Navigation Core
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
        if (backBtn) backBtn.style.display = 'inline-flex';
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

function checkAdminAccess() {
    navigateTo('pageLogin');
}

function performAdminLogin() {
    const userInput = document.getElementById('loginUsername');
    const passInput = document.getElementById('loginPassword');

    const correctUsername = "admin";
    const correctPassword = "admin70"; 

    const enterUser = userInput ? userInput.value.trim() : '';
    const enterPass = passInput ? passInput.value.trim() : '';

    if (enterUser.toLowerCase() === correctUsername.toLowerCase() && enterPass === correctPassword) {
        navigateTo('pageAdmin');
        loadAdminCategories();
        loadAdminRestaurants();
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
    } else {
        alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
    }
}

function logoutAdmin() {
    navigateTo('pageHome');
}

// Helper to bind events safely
function bindClick(selectorOrElem, callback) {
    const elem = typeof selectorOrElem === 'string' ? document.querySelector(selectorOrElem) : selectorOrElem;
    if (!elem) return;
    
    elem.style.cursor = 'pointer';
    elem.onclick = (e) => {
        e.preventDefault();
        callback(e);
    };
}

// Render Functions
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
            bindClick(card, () => openRestaurants(name));
            card.innerHTML = `
                <img src="${img}" alt="${name}">
                <h3>${name}</h3>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error(error);
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
                bindClick(card, () => openRestaurantDetails(data));
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
        console.error(error);
        grid.innerHTML = '<p class="error-text">حدث خطأ أثناء تحميل المطاعم.</p>';
    }
}

function openRestaurants(categoryName) {
    const heroTitle = document.getElementById('categoryHeroTitle');
    if (heroTitle) heroTitle.textContent = categoryName;
    navigateTo('pageRestaurants');
    renderUserRestaurants(categoryName);
}

function openRestaurantDetails(data) {
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

// Admin Operations
async function loadAdminCategories() {
    const container = document.getElementById('adminManageCategoriesContainer');
    const select = document.getElementById('adminCategory');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        container.innerHTML = '';
        if (select) select.innerHTML = '<option value="">اختر القسم...</option>';

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const catName = data.nameAr || data.name || '';

            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <span>${catName}</span>
                <button data-id="${id}" class="delete-cat-btn">حذف</button>
            `;
            container.appendChild(item);

            if (select) {
                const option = document.createElement('option');
                option.value = catName;
                option.textContent = catName;
                select.appendChild(option);
            }
        });

        container.querySelectorAll('.delete-cat-btn').forEach(btn => {
            bindClick(btn, (e) => deleteCategoryFromFirebase(e.target.dataset.id));
        });
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
            alert("حدث خطأ أثناء الحذف: " + error.message);
        }
    }
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
                <div><strong>${data.name}</strong> (${data.category})</div>
                <button data-id="${id}" class="delete-rest-btn">حذف</button>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('.delete-rest-btn').forEach(btn => {
            bindClick(btn, (e) => deleteRestaurantFromFirebase(e.target.dataset.id));
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
            alert("حدث خطأ أثناء الحذف: " + error.message);
        }
    }
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
        console.error("Save Category Error:", error);
        alert("حدث خطأ أثناء حفظ القسم: " + error.message);
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
        await addDoc(collection(db, "restaurants"), { name, category, desc, logo, phone, menu, map });
        alert("تمت إضافة المطعم بنجاح!");
        resetAdminForm();
        loadAdminRestaurants();
    } catch (error) {
        console.error("Save Restaurant Error:", error);
        alert("حدث خطأ أثناء حفظ المطعم: " + error.message);
    }
}

function resetCategoryForm() {
    if (document.getElementById('adminCatAr')) document.getElementById('adminCatAr').value = '';
    if (document.getElementById('adminCatEn')) document.getElementById('adminCatEn').value = '';
    if (document.getElementById('adminCatImg')) document.getElementById('adminCatImg').value = '';
}

function resetAdminForm() {
    if (document.getElementById('adminName')) document.getElementById('adminName').value = '';
    if (document.getElementById('adminDesc')) document.getElementById('adminDesc').value = '';
    if (document.getElementById('adminLogo')) document.getElementById('adminLogo').value = '';
    if (document.getElementById('adminPhone')) document.getElementById('adminPhone').value = '';
    if (document.getElementById('adminMenu')) document.getElementById('adminMenu').value = '';
    if (document.getElementById('adminMap')) document.getElementById('adminMap').value = '';
    if (document.getElementById('adminGallery')) document.getElementById('adminGallery').value = '';
}

// Export functions to global scope
window.navigateTo = navigateTo;
window.goBack = goBack;
window.openCategories = openCategories;
window.checkAdminAccess = checkAdminAccess;

// Direct Event Bindings
document.addEventListener('DOMContentLoaded', () => {
    bindClick('.region-card', () => openCategories());
    bindClick('#backBtn', () => goBack());
    bindClick('.app-footer', () => checkAdminAccess());

    bindClick('#loginSubmitBtn', () => performAdminLogin());
    bindClick('#btnLogoutAdmin', () => logoutAdmin());

    bindClick('#btnSaveCategory', () => saveCategoryToFirebase());
    bindClick('#btnResetCategory', () => resetCategoryForm());

    bindClick('#btnSaveRestaurant', () => saveRestaurantToFirebase());
    bindClick('#btnResetRestaurant', () => resetAdminForm());
});
