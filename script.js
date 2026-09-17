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
    const titleElem = document.getElementById('selectedCategoryTitle');
    if (titleElem) titleElem.textContent = categoryName;
    navigateTo('pageRestaurants');
    renderUserRestaurants(categoryName);
}

// 3. User Data Rendering (Firestore Fetching)
async function renderUserCategories() {
    const grid = document.getElementById('userCategoriesGrid');
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
            const card = document.createElement('div');
            card.className = 'category-card';
            card.onclick = () => openRestaurants(data.name);
            card.innerHTML = `
                <img src="${data.image || 'https://via.placeholder.com/150'}" alt="${data.name}">
                <h3>${data.name}</h3>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        grid.innerHTML = '<p class="error-text">حدث خطأ أثناء تحميل الأقسام.</p>';
    }
}

async function renderUserRestaurants(categoryName) {
    const grid = document.getElementById('userRestaurantsGrid');
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
                    <img src="${data.image || 'https://via.placeholder.com/300'}" alt="${data.name}">
                    <div class="restaurant-info">
                        <h3>${data.name}</h3>
                        <p>${data.description || ''}</p>
                        <span class="phone-badge">${data.phone || ''}</span>
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
    const nameElem = document.getElementById('menuRestaurantName');
    const imgElem = document.getElementById('menuRestaurantImage');
    const phoneElem = document.getElementById('menuRestaurantPhone');

    if (nameElem) nameElem.textContent = data.name;
    if (imgElem) imgElem.src = data.image || 'https://via.placeholder.com/300';
    if (phoneElem) {
        phoneElem.textContent = data.phone || '';
        phoneElem.href = `tel:${data.phone || ''}`;
    }

    navigateTo('pageMenu');
}

// 4. Admin Management Functions
function checkAdminAccess() {
    navigateTo('pageAdminLogin');
}

function performAdminLogin() {
    const passInput = document.getElementById('adminPassword');
    if (passInput && passInput.value === "123456") {
        navigateTo('pageAdminPanel');
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

async function saveCategoryToFirebase() {
    const nameInput = document.getElementById('categoryNameInput');
    const imageInput = document.getElementById('categoryImageInput');

    if (!nameInput || !nameInput.value.trim()) {
        alert("يرجى إدخال اسم القسم");
        return;
    }

    try {
        await addDoc(collection(db, "categories"), {
            name: nameInput.value.trim(),
            image: imageInput ? imageInput.value.trim() : ''
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
    const nameInput = document.getElementById('categoryNameInput');
    const imageInput = document.getElementById('categoryImageInput');
    if (nameInput) nameInput.value = '';
    if (imageInput) imageInput.value = '';
}

async function loadAdminCategories() {
    const list = document.getElementById('adminCategoriesList');
    const select = document.getElementById('restaurantCategorySelect');
    if (!list) return;

    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        list.innerHTML = '';
        if (select) select.innerHTML = '<option value="">اختر القسم</option>';

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            // Update List
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <span>${data.name}</span>
                <button onclick="deleteCategoryFromFirebase('${id}')">حذف</button>
            `;
            list.appendChild(item);

            // Update Select Dropdown
            if (select) {
                const option = document.createElement('option');
                option.value = data.name;
                option.textContent = data.name;
                select.appendChild(option);
            }
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
            console.error("Error deleting category:", error);
        }
    }
}

async function saveRestaurantToFirebase() {
    const name = document.getElementById('restaurantNameInput')?.value.trim();
    const category = document.getElementById('restaurantCategorySelect')?.value;
    const phone = document.getElementById('restaurantPhoneInput')?.value.trim();
    const image = document.getElementById('restaurantImageInput')?.value.trim();
    const description = document.getElementById('restaurantDescInput')?.value.trim();

    if (!name || !category) {
        alert("يرجى ملء اسم المطعم واختيار القسم!");
        return;
    }

    try {
        await addDoc(collection(db, "restaurants"), {
            name,
            category,
            phone,
            image,
            description
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
    const inputs = ['restaurantNameInput', 'restaurantPhoneInput', 'restaurantImageInput', 'restaurantDescInput'];
    inputs.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.value = '';
    });
    const select = document.getElementById('restaurantCategorySelect');
    if (select) select.value = '';
}

async function loadAdminRestaurants() {
    const list = document.getElementById('adminRestaurantsList');
    if (!list) return;

    try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        list.innerHTML = '';

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
            list.appendChild(item);
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

// 5. Filter / Search Functions
function filterCategories() {
    const input = document.getElementById('searchCategoryInput');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('#userCategoriesGrid .category-card');

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(filter) ? 'block' : 'none';
    });
}

function filterRestaurants() {
    const input = document.getElementById('searchRestaurantInput');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('#userRestaurantsGrid .restaurant-card');

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = title.includes(filter) ? 'block' : 'none';
    });
}

// 6. Global Window Exports (لربط الأحداث مع HTML مباشرة)
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial page load check
    const activePage = document.querySelector('.view-page.active');
    if (!activePage) {
        navigateTo('pageHome', false);
    }
});
