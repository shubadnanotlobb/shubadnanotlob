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

function checkAdminAccess() {
    navigateTo('pageLogin');
}

function performAdminLogin() {
    const passInput = document.getElementById('loginPassword');
    if (passInput && passInput.value === "123456") {
        navigateTo('pageAdmin');
        loadAdminCategories();
        loadAdminRestaurants();
        passInput.value = '';
    } else {
        alert("كلمة المرور غير صحيحة!");
    }
}

function logoutAdmin() {
    navigateTo('pageHome');
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
            card.onclick = () => openRestaurants(name);
            card.innerHTML = `
                <img src="${img}" alt="${name}">
                <h3>${name}</h3>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
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

// Admin Logic
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

        document.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.onclick = (e) => deleteCategoryFromFirebase(e.target.dataset.id);
        });
    } catch (error) {
        console.error(error);
    }
}

async function deleteCategoryFromFirebase(id) {
    if (confirm("هل أنت تأكد من حذف هذا القسم؟")) {
        await deleteDoc(doc(db, "categories", id));
        loadAdminCategories();
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

        document.querySelectorAll('.delete-rest-btn').forEach(btn => {
            btn.onclick = (e) => deleteRestaurantFromFirebase(e.target.dataset.id);
        });
    } catch (error) {
        console.error(error);
    }
}

async function deleteRestaurantFromFirebase(id) {
    if (confirm("هل أنت تأكد من حذف هذا المطعم؟")) {
        await deleteDoc(doc(db, "restaurants", id));
        loadAdminRestaurants();
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

    await addDoc(collection(db, "categories"), {
        nameAr: nameArInput.value.trim(),
        nameEn: nameEnInput ? nameEnInput.value.trim() : '',
        image: imgInput ? imgInput.value.trim() : ''
    });
    alert("تمت إضافة القسم بنجاح!");
    nameArInput.value = '';
    loadAdminCategories();
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

    await addDoc(collection(db, "restaurants"), { name, category, desc, logo, phone, menu, map });
    alert("تمت إضافة المطعم بنجاح!");
    loadAdminRestaurants();
}

// Global Export Assignment
window.navigateTo = navigateTo;
window.goBack = goBack;

// Mandatory Direct DOM Bindings
document.addEventListener('DOMContentLoaded', () => {
    // 1. Click Region Card
    const regionCard = document.querySelector('.region-card');
    if (regionCard) regionCard.onclick = () => openCategories();

    // 2. Back Button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.onclick = () => goBack();

    // 3. Footer Admin Trigger
    const footer = document.querySelector('.app-footer');
    if (footer) footer.onclick = () => checkAdminAccess();

    // 4. Admin Login Button
    const loginBtn = document.querySelector('#pageLogin .admin-btn');
    if (loginBtn) loginBtn.onclick = () => performAdminLogin();

    // 5. Admin Logout Button
    const logoutBtn = document.querySelector('.admin-btn-logout');
    if (logoutBtn) logoutBtn.onclick = () => logoutAdmin();

    // 6. Save Category Button
    const saveCatBtn = document.querySelectorAll('#pageAdmin .admin-btn')[0];
    if (saveCatBtn) saveCatBtn.onclick = () => saveCategoryToFirebase();

    // 7. Save Restaurant Button
    const saveRestBtn = document.querySelectorAll('#pageAdmin .admin-btn')[2];
    if (saveRestBtn) saveRestBtn.onclick = () => saveRestaurantToFirebase();
});
