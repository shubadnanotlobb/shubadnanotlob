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
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. Firebase Config
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
const storage = getStorage(app);

// Global Variables
let currentCategoryFilter = "";
let allRestaurants = [];
let allCategories = [];

// Helper File Upload
async function uploadFileToStorage(file, folderName) {
    if (!file) return "";
    const fileRef = ref(storage, `${folderName}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
}

// 2. Navigation
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
        backBtn.style.display = (pageId === 'pageHome') ? 'none' : 'inline-flex';
    }

    window.scrollTo(0, 0);
}

function goBack() {
    showPage('pageHome');
}

function openCategories() {
    showPage('pageCategories');
}

// 3. Categories Management
function resetCategoryForm() {
    document.getElementById('editCatDocId').value = '';
    document.getElementById('adminCatAr').value = '';
    document.getElementById('adminCatEn').value = '';
    document.getElementById('adminCatImg').value = '';
    document.getElementById('adminCatFileInput').value = '';
    document.getElementById('catUploadStatus').style.display = 'none';
    document.getElementById('categoryFormTitle').innerText = 'إضافة / تعديل قسم';
}

async function saveCategoryToFirebase() {
    const docId = document.getElementById('editCatDocId').value;
    const nameAr = document.getElementById('adminCatAr').value.trim();
    const nameEn = document.getElementById('adminCatEn').value.trim();
    const urlInput = document.getElementById('adminCatImg').value.trim();
    const fileInput = document.getElementById('adminCatFileInput');
    const status = document.getElementById('catUploadStatus');
    const saveBtn = document.getElementById('saveCatBtn');

    if (!nameAr || !nameEn) {
        alert('يرجى إدخال اسم القسم بالعربي والإنجليزي');
        return;
    }

    try {
        if (saveBtn) saveBtn.disabled = true;
        if (status) {
            status.innerText = "جاري رفع البيانات والتغييرات...";
            status.style.display = "block";
        }

        let finalImgUrl = urlInput || "";
        if (fileInput && fileInput.files.length > 0) {
            finalImgUrl = await uploadFileToStorage(fileInput.files[0], "category_images");
        }

        if (docId) {
            const updatePayload = {
                nameAr: nameAr,
                nameEn: nameEn,
                updatedAt: serverTimestamp()
            };
            if (finalImgUrl) updatePayload.imgUrl = finalImgUrl;

            await updateDoc(doc(db, "categories", docId), updatePayload);
            alert('تم تعديل القسم بنجاح!');
        } else {
            await addDoc(collection(db, "categories"), {
                nameAr: nameAr,
                nameEn: nameEn,
                imgUrl: finalImgUrl,
                createdAt: serverTimestamp()
            });
            alert('تم إضافة القسم بنجاح!');
        }
        resetCategoryForm();
    } catch (error) {
        console.error("Error saving category: ", error);
        alert('حدث خطأ أثناء حفظ القسم: ' + error.message);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (status) status.style.display = "none";
    }
}

function editCategory(id, nameAr, nameEn, imgUrl) {
    document.getElementById('editCatDocId').value = id;
    document.getElementById('adminCatAr').value = nameAr;
    document.getElementById('adminCatEn').value = nameEn;
    document.getElementById('adminCatImg').value = imgUrl || '';
    document.getElementById('categoryFormTitle').innerText = 'تعديل القسم';
}

async function deleteCategoryFromFirebase(id) {
    if (confirm('هل أنت تأكد من حذف هذا القسم؟')) {
        try {
            await deleteDoc(doc(db, "categories", id));
            alert('تم حذف القسم بنجاح');
        } catch (error) {
            console.error("Error deleting category:", error);
            alert('حدث خطأ أثناء الحذف');
        }
    }
}

// 4. Restaurant Management
function resetAdminForm() {
    document.getElementById('editDocId').value = '';
    document.getElementById('adminCategory').value = '';
    document.getElementById('adminName').value = '';
    document.getElementById('adminDesc').value = '';
    document.getElementById('adminLogo').value = '';
    document.getElementById('adminLogoFileInput').value = '';
    document.getElementById('adminGallery').value = '';
    document.getElementById('adminGalleryFilesInput').value = '';
    document.getElementById('adminPhone').value = '';
    document.getElementById('adminMenu').value = '';
    document.getElementById('adminMap').value = '';
    document.getElementById('restUploadStatus').style.display = 'none';
    document.getElementById('formTitle').innerText = 'إضافة مطعم جديد';
}

async function saveRestaurantToFirebase() {
    const docId = document.getElementById('editDocId').value;
    const category = document.getElementById('adminCategory').value;
    const name = document.getElementById('adminName').value.trim();
    const desc = document.getElementById('adminDesc').value.trim();
    const logoUrlInput = document.getElementById('adminLogo').value.trim();
    const logoFileInput = document.getElementById('adminLogoFileInput');
    const galleryRaw = document.getElementById('adminGallery').value.trim();
    const galleryFilesInput = document.getElementById('adminGalleryFilesInput');
    const phone = document.getElementById('adminPhone').value.trim();
    const menu = document.getElementById('adminMenu').value.trim();
    const map = document.getElementById('adminMap').value.trim();
    const saveBtn = document.getElementById('saveRestBtn');
    const status = document.getElementById('restUploadStatus');

    if (!name || !category) {
        alert('يرجى كتابة اسم المطعم واختيار القسم');
        return;
    }

    try {
        if (saveBtn) saveBtn.disabled = true;
        if (status) {
            status.innerText = "جاري رفع الصور والبيانات إلى Firebase...";
            status.style.display = "block";
        }

        let finalLogo = logoUrlInput || "";
        if (logoFileInput && logoFileInput.files.length > 0) {
            finalLogo = await uploadFileToStorage(logoFileInput.files[0], "restaurant_logos");
        }

        let galleryArray = galleryRaw ? galleryRaw.split(',').map(item => item.trim()).filter(i => i) : [];
        if (galleryFilesInput && galleryFilesInput.files.length > 0) {
            for (let i = 0; i < galleryFilesInput.files.length; i++) {
                const uploadedUrl = await uploadFileToStorage(galleryFilesInput.files[i], "restaurant_galleries");
                if (uploadedUrl) galleryArray.push(uploadedUrl);
            }
        }

        const restaurantData = {
            category: category,
            name: name,
            desc: desc,
            logo: finalLogo,
            gallery: galleryArray,
            phone: phone,
            menu: menu,
            map: map,
            updatedAt: serverTimestamp()
        };

        if (docId) {
            await updateDoc(doc(db, "restaurants", docId), restaurantData);
            alert('تم تحديث بيانات المطعم بنجاح!');
        } else {
            restaurantData.createdAt = serverTimestamp();
            await addDoc(collection(db, "restaurants"), restaurantData);
            alert('تم حفظ المطعم بنجاح!');
        }
        resetAdminForm();
    } catch (error) {
        console.error("Error saving restaurant: ", error);
        alert('حدث خطأ أثناء حفظ المطعم: ' + error.message);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (status) status.style.display = "none";
    }
}

function editRestaurant(r) {
    document.getElementById('editDocId').value = r.id;
    document.getElementById('adminCategory').value = r.category || '';
    document.getElementById('adminName').value = r.name || '';
    document.getElementById('adminDesc').value = r.desc || '';
    document.getElementById('adminLogo').value = r.logo || '';
    document.getElementById('adminGallery').value = r.gallery ? r.gallery.join(', ') : '';
    document.getElementById('adminPhone').value = r.phone || '';
    document.getElementById('adminMenu').value = r.menu || '';
    document.getElementById('adminMap').value = r.map || '';
    document.getElementById('formTitle').innerText = 'تعديل المطعم';
}

async function deleteRestaurantFromFirebase(id) {
    if (confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
        try {
            await deleteDoc(doc(db, "restaurants", id));
            alert('تم الحذف بنجاح');
        } catch (error) {
            console.error("Error deleting restaurant:", error);
            alert('حدث خطأ أثناء الحذف');
        }
    }
}

// 5. Auth
function checkAdminAccess() {
    const isAdmin = sessionStorage.getItem('isAdminLoggedIn');
    if (isAdmin === 'true') {
        showPage('pageAdmin');
    } else {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        showPage('pageLogin');
    }
}

function performAdminLogin() {
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;

    if (user === 'admin' && pass === '123456') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        showPage('pageAdmin');
    } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('isAdminLoggedIn');
    showPage('pageHome');
}

// 6. UI & Filter Renderers
function filterCategories() {
    const queryStr = document.getElementById('categoriesSearchInput')?.value.toLowerCase().trim() || '';
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = allCategories.filter(c => 
        (c.nameAr && c.nameAr.toLowerCase().includes(queryStr)) || 
        (c.nameEn && c.nameEn.toLowerCase().includes(queryStr))
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #777; grid-column: span 2;">لا توجد أقسام مطابقة للبحث.</p>';
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
    document.getElementById('categoryHeroTitle').innerText = catName;
    document.getElementById('categoryHeroImg').src = catImg || 'https://via.placeholder.com/400x150';

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
        container.innerHTML = '<p style="text-align: center; color: #777; grid-column: span 2;">لا توجد مطاعم حالياً في هذا القسم.</p>';
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
    document.getElementById('profileLogo').src = r.logo || 'https://via.placeholder.com/100';
    document.getElementById('profileName').innerText = r.name || '';
    document.getElementById('profileDesc').innerText = r.desc || '';

    document.getElementById('profileMenuBtn').href = r.menu || '#';
    document.getElementById('profileContactBtn').href = r.phone ? `https://wa.me/${r.phone}` : '#';
    document.getElementById('profileLocationBtn').href = r.map || '#';

    const profileGallery = document.getElementById('profileGalleryContainer');
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

// 7. Realtime Firebase Listeners
function listenToCategories() {
    try {
        const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            allCategories = [];
            const adminCatContainer = document.getElementById('adminManageCategoriesContainer');
            const selectDropdown = document.getElementById('adminCategory');

            if (adminCatContainer) adminCatContainer.innerHTML = '';
            if (selectDropdown) selectDropdown.innerHTML = '<option value="">اختر القسم...</option>';

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const id = docSnap.id;
                allCategories.push({ id, ...data });

                if (selectDropdown) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = data.nameAr || data.nameEn;
                    selectDropdown.appendChild(option);
                }

                if (adminCatContainer) {
                    const item = document.createElement('div');
                    item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;";
                    item.innerHTML = `
                        <span>${data.nameAr} (${data.nameEn})</span>
                        <div>
                            <button type="button" style="padding: 4px 8px; background: #008080; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.editCategory('${id}', '${data.nameAr}', '${data.nameEn}', '${data.imgUrl || ''}')">تعديل</button>
                            <button type="button" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteCategoryFromFirebase('${id}')">حذف</button>
                        </div>
                    `;
                    adminCatContainer.appendChild(item);
                }
            });

            filterCategories();
        }, (err) => console.log("Firebase listener error:", err));
    } catch(e) {
        console.error("Database connection error:", e);
    }
}

function listenToRestaurants() {
    try {
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
                            <button type="button" style="padding: 4px 8px; background: #008080; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 5px;" onclick='window.editRestaurant(${JSON.stringify({id, ...data})})'>تعديل</button>
                            <button type="button" style="padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.deleteRestaurantFromFirebase('${id}')">حذف</button>
                        </div>
                    `;
                    adminRestContainer.appendChild(item);
                }
            });

            if (currentCategoryFilter) {
                renderRestaurantsList();
            }
        }, (err) => console.log("Firebase listener error:", err));
    } catch(e) {
        console.error("Database connection error:", e);
    }
}

// 8. Global Exports to Window Scope
window.showPage = showPage;
window.goBack = goBack;
window.openCategories = openCategories;
window.resetCategoryForm = resetCategoryForm;
window.saveCategoryToFirebase = saveCategoryToFirebase;
window.editCategory = editCategory;
window.deleteCategoryFromFirebase = deleteCategoryFromFirebase;
window.resetAdminForm = resetAdminForm;
window.saveRestaurantToFirebase = saveRestaurantToFirebase;
window.editRestaurant = editRestaurant;
window.deleteRestaurantFromFirebase = deleteRestaurantFromFirebase;
window.checkAdminAccess = checkAdminAccess;
window.performAdminLogin = performAdminLogin;
window.logoutAdmin = logoutAdmin;
window.filterCategories = filterCategories;
window.filterRestaurants = filterRestaurants;
window.openRestaurantsByCategory = openRestaurantsByCategory;
window.openRestaurantProfile = openRestaurantProfile;

// Init Event Listener
document.addEventListener('DOMContentLoaded', () => {
    listenToCategories();
    listenToRestaurants();
    showPage('pageHome');
});
