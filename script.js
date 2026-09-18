import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    update, 
    remove, 
    onValue 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let currentCategoryFilter = "";
let allRestaurants = [];
let allCategories = [];

function showPage(pageId) {
    document.querySelectorAll('.view-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.style.display = (pageId === 'pageHome') ? 'none' : 'block';
    }

    window.scrollTo(0, 0);
}

function goBack() { showPage('pageHome'); }
function openCategories() { showPage('pageCategories'); }

function resetCategoryForm() {
    if (document.getElementById('editCatDocId')) document.getElementById('editCatDocId').value = '';
    if (document.getElementById('adminCatAr')) document.getElementById('adminCatAr').value = '';
    if (document.getElementById('adminCatEn')) document.getElementById('adminCatEn').value = '';
    if (document.getElementById('adminCatImg')) document.getElementById('adminCatImg').value = '';
    if (document.getElementById('categoryFormTitle')) document.getElementById('categoryFormTitle').innerText = 'Add / Edit Category';
}

async function saveCategoryToFirebase() {
    const docId = document.getElementById('editCatDocId')?.value;
    const nameAr = document.getElementById('adminCatAr')?.value.trim();
    const nameEn = document.getElementById('adminCatEn')?.value.trim();
    const imgUrl = document.getElementById('adminCatImg')?.value.trim();

    if (!nameAr || !nameEn) {
        alert('يرجى إدخال اسم القسم بالعربي والإنجليزي');
        return;
    }

    try {
        if (docId) {
            await update(ref(db, 'categories/' + docId), { nameAr, nameEn, imgUrl });
            alert('تم تعديل القسم بنجاح!');
        } else {
            const newCatRef = push(ref(db, 'categories'));
            await set(newCatRef, { nameAr, nameEn, imgUrl, createdAt: Date.now() });
            alert('تم إضافة القسم بنجاح!');
        }
        resetCategoryForm();
    } catch (error) {
        console.error("Error saving category: ", error);
        alert('حدث خطأ أثناء حفظ القسم (تأكد من تسجيل الدخول)');
    }
}

function editCategory(id, nameAr, nameEn, imgUrl) {
    document.getElementById('editCatDocId').value = id;
    document.getElementById('adminCatAr').value = nameAr;
    document.getElementById('adminCatEn').value = nameEn;
    document.getElementById('adminCatImg').value = imgUrl || '';
    document.getElementById('categoryFormTitle').innerText = 'Edit Category';
}

async function deleteCategoryFromFirebase(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        try {
            await remove(ref(db, 'categories/' + id));
            alert('تم حذف القسم بنجاح');
        } catch (error) {
            console.error("Error deleting category:", error);
            alert('حدث خطأ أثناء الحذف');
        }
    }
}

function resetAdminForm() {
    if (document.getElementById('editDocId')) document.getElementById('editDocId').value = '';
    if (document.getElementById('adminName')) document.getElementById('adminName').value = '';
    if (document.getElementById('adminDesc')) document.getElementById('adminDesc').value = '';
    if (document.getElementById('adminLogo')) document.getElementById('adminLogo').value = '';
    if (document.getElementById('adminGallery')) document.getElementById('adminGallery').value = '';
    if (document.getElementById('adminPhone')) document.getElementById('adminPhone').value = '';
    if (document.getElementById('adminMenu')) document.getElementById('adminMenu').value = '';
    if (document.getElementById('adminMap')) document.getElementById('adminMap').value = '';
    if (document.getElementById('formTitle')) document.getElementById('formTitle').innerText = 'Add New Restaurant';
}

async function saveRestaurantToFirebase() {
    const docId = document.getElementById('editDocId')?.value;
    const category = document.getElementById('adminCategory')?.value;
    const name = document.getElementById('adminName')?.value.trim();
    const desc = document.getElementById('adminDesc')?.value.trim();
    const logo = document.getElementById('adminLogo')?.value.trim();
    const galleryRaw = document.getElementById('adminGallery')?.value.trim();
    const phone = document.getElementById('adminPhone')?.value.trim();
    const menu = document.getElementById('adminMenu')?.value.trim();
    const map = document.getElementById('adminMap')?.value.trim();

    if (!name || !category) {
        alert('يرجى كتابة اسم المطعم واختيار القسم على الأقل');
        return;
    }

    const galleryArray = galleryRaw ? galleryRaw.split(',').map(item => item.trim()) : [];
    const restaurantData = { category, name, desc, logo, gallery: galleryArray, phone, menu, map, updatedAt: Date.now() };

    try {
        if (docId) {
            await update(ref(db, 'restaurants/' + docId), restaurantData);
            alert('تم تحديث بيانات المطعم بنجاح!');
        } else {
            restaurantData.createdAt = Date.now();
            const newRestRef = push(ref(db, 'restaurants'));
            await set(newRestRef, restaurantData);
            alert('تم حفظ المطعم بنجاح!');
        }
        resetAdminForm();
    } catch (error) {
        console.error("Error saving restaurant: ", error);
        alert('حدث خطأ أثناء حفظ المطعم (تأكد من تسجيل الدخول)');
    }
}

async function deleteRestaurantFromFirebase(id) {
    if (confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
        try {
            await remove(ref(db, 'restaurants/' + id));
            alert('تم الحذف بنجاح');
        } catch (error) {
            console.error("Error deleting restaurant:", error);
            alert('حدث خطأ أثناء الحذف');
        }
    }
}

async function performAdminLogin() {
    const userEmail = document.getElementById('loginUsername')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value;

    if (!userEmail || !pass) {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, userEmail, pass);
    } catch (error) {
        console.error("Login error: ", error);
        alert('خطأ في تسجيل الدخول: تأكد من صحة البريد الإلكتروني وكلمة المرور');
    }
}

async function logoutAdmin() {
    try {
        await signOut(auth);
        showPage('pageHome');
    } catch (error) {
        console.error("Logout error: ", error);
    }
}

function checkAdminAccess() {
    const user = auth.currentUser;
    if (user) {
        showPage('pageAdmin');
    } else {
        if (document.getElementById('loginUsername')) document.getElementById('loginUsername').value = '';
        if (document.getElementById('loginPassword')) document.getElementById('loginPassword').value = '';
        showPage('pageLogin');
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        const activePage = document.querySelector('.view-page.active');
        if (activePage && activePage.id === 'pageLogin') {
            showPage('pageAdmin');
        }
    }
});

function filterCategories() {
    const queryStr = document.getElementById('categoriesSearchInput')?.value.toLowerCase().trim();
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = allCategories.filter(c => 
        (c.nameAr && c.nameAr.toLowerCase().includes(queryStr)) || 
        (c.nameEn && c.nameEn.toLowerCase().includes(queryStr))
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">لا توجد أقسام مطابقة للبحث.</p>';
        return;
    }

    filtered.forEach(data => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => openRestaurantsByCategory(data.id, data.nameAr || data.nameEn, data.imgUrl);
        card.innerHTML = `
            <img src="${data.imgUrl || 'https://via.placeholder.com/150'}" alt="${data.nameAr}">
            <div class="category-title">${data.nameAr}</div>
        `;
        grid.appendChild(card);
    });
}

function filterRestaurants() {
    const queryStr = document.getElementById('restaurantsSearchInput')?.value.toLowerCase().trim();
    renderRestaurantsList(queryStr);
}

function openRestaurantsByCategory(catId, catName, catImg) {
    currentCategoryFilter = catId;
    const heroTitle = document.getElementById('categoryHeroTitle');
    const heroImg = document.getElementById('categoryHeroImg');
    if (heroTitle) heroTitle.innerText = catName;
    if (heroImg) heroImg.src = catImg || 'https://via.placeholder.com/400x150';

    renderRestaurantsList();
    showPage('pageRestaurants');
}

function renderRestaurantsList(searchQuery = '') {
    const container = document.getElementById('restaurantsListContainer');
    if (!container) return;
    container.innerHTML = '';

    let filtered = allRestaurants.filter(r => r.category === currentCategoryFilter);
    if (searchQuery) {
        filtered = filtered.filter(r => r.name && r.name.toLowerCase().includes(searchQuery));
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">لا توجد مطاعم حالياً.</p>';
        return;
    }

    filtered.forEach(r => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.onclick = () => openRestaurantProfile(r);
        card.innerHTML = `
            <img src="${r.logo || 'https://via.placeholder.com/100'}" alt="${r.name}">
            <div class="restaurant-info">
                <h3>${r.name}</h3>
                <p>${r.desc || ''}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function openRestaurantProfile(r) {
    const profileLogo = document.getElementById('profileLogo');
    const profileName = document.getElementById('profileName');
    const profileDesc = document.getElementById('profileDesc');
    const profileGallery = document.getElementById('profileGalleryContainer');
    const menuBtn = document.getElementById('profileMenuBtn');
    const contactBtn = document.getElementById('profileContactBtn');
    const locationBtn = document.getElementById('profileLocationBtn');

    if (profileLogo) profileLogo.src = r.logo || 'https://via.placeholder.com/100';
    if (profileName) profileName.innerText = r.name || '';
    if (profileDesc) profileDesc.innerText = r.desc || '';

    if (menuBtn) menuBtn.href = r.menu || '#';
    if (contactBtn) contactBtn.href = r.phone ? `https://wa.me/${r.phone}` : '#';
    if (locationBtn) locationBtn.href = r.map || '#';

    if (profileGallery) {
        profileGallery.innerHTML = '';
        if (r.gallery && r.gallery.length > 0) {
            r.gallery.forEach(imgUrl => {
                if (imgUrl) {
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    profileGallery.appendChild(img);
                }
            });
        }
    }

    showPage('pageRestProfile');
}

function listenToCategories() {
    try {
        const categoriesRef = ref(db, 'categories');
        onValue(categoriesRef, (snapshot) => {
            allCategories = [];
            const adminCatContainer = document.getElementById('adminManageCategoriesContainer');
            const selectDropdown = document.getElementById('adminCategory');

            if (adminCatContainer) adminCatContainer.innerHTML = '';
            if (selectDropdown) selectDropdown.innerHTML = '<option value="">اختر القسم...</option>';

            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach((id) => {
                    const item = data[id];
                    allCategories.push({ id, ...item });

                    if (selectDropdown) {
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = item.nameAr || item.nameEn;
                        selectDropdown.appendChild(option);
                    }

                    if (adminCatContainer) {
                        const div = document.createElement('div');
                        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
                        div.innerHTML = `
                            <span>${item.nameAr} (${item.nameEn})</span>
                            <div>
                                <button type="button" style="padding: 4px 8px; background: #008080; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.editCategory('${id}', '${item.nameAr}', '${item.nameEn}', '${item.imgUrl || ''}')">تعديل</button>
                                <button type="button" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteCategoryFromFirebase('${id}')">حذف</button>
                            </div>
                        `;
                        adminCatContainer.appendChild(div);
                    }
                });
            }
            filterCategories();
        });
    } catch(e) { console.error(e); }
}

function listenToRestaurants() {
    try {
        const restaurantsRef = ref(db, 'restaurants');
        onValue(restaurantsRef, (snapshot) => {
            allRestaurants = [];
            const adminRestContainer = document.getElementById('adminManageListContainer');
            if (adminRestContainer) adminRestContainer.innerHTML = '';

            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach((id) => {
                    const item = data[id];
                    allRestaurants.push({ id, ...item });

                    if (adminRestContainer) {
                        const div = document.createElement('div');
                        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
                        div.innerHTML = `
                            <span>${item.name}</span>
                            <div>
                                <button type="button" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteRestaurantFromFirebase('${id}')">حذف</button>
                            </div>
                        `;
                        adminRestContainer.appendChild(div);
                    }
                });
            }

            if (currentCategoryFilter) renderRestaurantsList();
        });
    } catch(e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
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
/* إلغاء أي طبقات شفافة وهمية قد تحجب اللمس عن باقي الشاشة */
.app-container {
    pointer-events: auto !important;
}

/* التأكد من أن الصفحات قابلة للنقر والتفاعل */
.view-page {
    pointer-events: auto !important;
}

/* منع الـ Footer من تغطية المحتوى وحجب اللمس */
.app-footer {
    pointer-events: auto !important;
    position: relative !important;
}
