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

// 1. Firebase Configuration (ضع إعدادات مشروعك هنا)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Variables
let currentCategoryFilter = "";
let allRestaurants = [];
let allCategories = [];

// 2. Window Functions for Category Form
window.resetCategoryForm = function() {
    const editId = document.getElementById('editCatDocId');
    const arInput = document.getElementById('adminCatAr');
    const enInput = document.getElementById('adminCatEn');
    const imgInput = document.getElementById('adminCatImg');
    const title = document.getElementById('categoryFormTitle');

    if (editId) editId.value = '';
    if (arInput) arInput.value = '';
    if (enInput) enInput.value = '';
    if (imgInput) imgInput.value = '';
    if (title) title.innerText = 'Add / Edit Category';
};

window.saveCategoryToFirebase = async function() {
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
            await updateDoc(doc(db, "categories", docId), {
                nameAr: nameAr,
                nameEn: nameEn,
                imgUrl: imgUrl
            });
            alert('تم تعديل القسم بنجاح!');
        } else {
            await addDoc(collection(db, "categories"), {
                nameAr: nameAr,
                nameEn: nameEn,
                imgUrl: imgUrl,
                createdAt: new Date()
            });
            alert('تم إضافة القسم بنجاح!');
        }
        window.resetCategoryForm();
    } catch (error) {
        console.error("Error saving category: ", error);
        alert('حدث خطأ أثناء حفظ القسم');
    }
};

window.editCategory = function(id, nameAr, nameEn, imgUrl) {
    document.getElementById('editCatDocId').value = id;
    document.getElementById('adminCatAr').value = nameAr;
    document.getElementById('adminCatEn').value = nameEn;
    document.getElementById('adminCatImg').value = imgUrl || '';
    document.getElementById('categoryFormTitle').innerText = 'Edit Category';
};

window.deleteCategoryFromFirebase = async function(id) {
    if (confirm('هل أنت تأكد من حذف هذا القسم؟')) {
        try {
            await deleteDoc(doc(db, "categories", id));
            alert('تم حذف القسم بنجاح');
        } catch (error) {
            console.error("Error deleting category:", error);
            alert('حدث خطأ أثناء الحذف');
        }
    }
};

// 3. Window Functions for Restaurant Form
window.resetAdminForm = function() {
    const editDocId = document.getElementById('editDocId');
    const adminName = document.getElementById('adminName');
    const adminDesc = document.getElementById('adminDesc');
    const adminLogo = document.getElementById('adminLogo');
    const adminGallery = document.getElementById('adminGallery');
    const adminPhone = document.getElementById('adminPhone');
    const adminMenu = document.getElementById('adminMenu');
    const adminMap = document.getElementById('adminMap');
    const formTitle = document.getElementById('formTitle');

    if (editDocId) editDocId.value = '';
    if (adminName) adminName.value = '';
    if (adminDesc) adminDesc.value = '';
    if (adminLogo) adminLogo.value = '';
    if (adminGallery) adminGallery.value = '';
    if (adminPhone) adminPhone.value = '';
    if (adminMenu) adminMenu.value = '';
    if (adminMap) adminMap.value = '';
    if (formTitle) formTitle.innerText = 'Add New Restaurant';
};

window.saveRestaurantToFirebase = async function() {
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

    const restaurantData = {
        category: category,
        name: name,
        desc: desc,
        logo: logo,
        gallery: galleryArray,
        phone: phone,
        menu: menu,
        map: map,
        updatedAt: new Date()
    };

    try {
        if (docId) {
            await updateDoc(doc(db, "restaurants", docId), restaurantData);
            alert('تم تحديث بيانات المطعم بنجاح!');
        } else {
            restaurantData.createdAt = new Date();
            await addDoc(collection(db, "restaurants"), restaurantData);
            alert('تم حفظ المطعم بنجاح!');
        }
        window.resetAdminForm();
    } catch (error) {
        console.error("Error saving restaurant: ", error);
        alert('حدث خطأ أثناء حفظ المطعم');
    }
};

window.deleteRestaurantFromFirebase = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
        try {
            await deleteDoc(doc(db, "restaurants", id));
            alert('تم الحذف بنجاح');
        } catch (error) {
            console.error("Error deleting restaurant:", error);
            alert('حدث خطأ أثناء الحذف');
        }
    }
};

// 4. Authentication & Navigation
window.checkAdminAccess = function() {
    const isAdmin = sessionStorage.getItem('isAdminLoggedIn');
    if (isAdmin === 'true') {
        showPage('pageAdmin');
    } else {
        showPage('pageLogin');
    }
};

window.performAdminLogin = function() {
    const user = document.getElementById('loginUsername')?.value;
    const pass = document.getElementById('loginPassword')?.value;

    if (user === 'admin' && pass === '123456') { // غير معلومات الدخول حسب رغبتك
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showPage('pageAdmin');
    } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
};

window.logoutAdmin = function() {
    sessionStorage.removeItem('isAdminLoggedIn');
    showPage('pageHome');
};

window.showPage = function(pageId) {
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
};

window.goBack = function() {
    showPage('pageHome');
};

window.openCategories = function() {
    showPage('pageCategories');
};

// 5. Firebase Realtime Listeners
function listenToCategories() {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        allCategories = [];
        const grid = document.getElementById('categoriesGridContainer');
        const adminCatContainer = document.getElementById('adminManageCategoriesContainer');
        const selectDropdown = document.getElementById('adminCategory');

        if (grid) grid.innerHTML = '';
        if (adminCatContainer) adminCatContainer.innerHTML = '';
        if (selectDropdown) selectDropdown.innerHTML = '<option value="">اختر القسم...</option>';

        if (snapshot.empty && grid) {
            grid.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">لا توجد أقسام حالياً.</p>';
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            allCategories.push({ id, ...data });

            // Populate Admin Dropdown
            if (selectDropdown) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = data.nameAr || data.nameEn;
                selectDropdown.appendChild(option);
            }

            // Populate Main UI Categories Grid
            if (grid) {
                const card = document.createElement('div');
                card.className = 'category-card';
                card.onclick = () => window.openRestaurantsByCategory(id, data.nameAr || data.nameEn, data.imgUrl);
                card.innerHTML = `
                    <img src="${data.imgUrl || 'https://via.placeholder.com/150'}" alt="${data.nameAr}">
                    <div class="category-title">${data.nameAr}</div>
                `;
                grid.appendChild(card);
            }

            // Populate Admin Manage Categories
            if (adminCatContainer) {
                const item = document.createElement('div');
                item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
                item.innerHTML = `
                    <span>${data.nameAr} (${data.nameEn})</span>
                    <div>
                        <button style="padding: 4px 8px; background: #008080; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="editCategory('${id}', '${data.nameAr}', '${data.nameEn}', '${data.imgUrl || ''}')">تعديل</button>
                        <button style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="deleteCategoryFromFirebase('${id}')">حذف</button>
                    </div>
                `;
                adminCatContainer.appendChild(item);
            }
        });
    });
}

function listenToRestaurants() {
    const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        allRestaurants = [];
        const adminRestContainer = document.getElementById('adminManageListContainer');
        if (adminRestContainer) adminRestContainer.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            allRestaurants.push({ id, ...data });

            if (adminRestContainer) {
                const item = document.createElement('div');
                item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
                item.innerHTML = `
                    <span>${data.name}</span>
                    <div>
                        <button style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="deleteRestaurantFromFirebase('${id}')">حذف</button>
                    </div>
                `;
                adminRestContainer.appendChild(item);
            }
        });
    });
}

window.openRestaurantsByCategory = function(catId, catName, catImg) {
    currentCategoryFilter = catId;
    const heroTitle = document.getElementById('categoryHeroTitle');
    const heroImg = document.getElementById('categoryHeroImg');
    if (heroTitle) heroTitle.innerText = catName;
    if (heroImg) heroImg.src = catImg || 'https://via.placeholder.com/400x150';

    renderRestaurantsList();
    showPage('pageRestaurants');
};

function renderRestaurantsList() {
    const container = document.getElementById('restaurantsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const filtered = allRestaurants.filter(r => r.category === currentCategoryFilter);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777; width: 100%;">لا توجد مطاعم في هذا القسم حالياً.</p>';
        return;
    }

    filtered.forEach(r => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
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

// 6. Initialization on Load
document.addEventListener('DOMContentLoaded', () => {
    listenToCategories();
    listenToRestaurants();
});
