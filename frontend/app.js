const API_URL = 'http://localhost:3000/api';
let token = null;
let currentUser = null;
let isEditing = false;
let editingProductId = null;

// DOM Elements
const productsGrid = document.getElementById('product-list');
const loginModal = document.getElementById('login-modal');
const adminModal = document.getElementById('admin-modal');
const loginBtn = document.getElementById('login-btn');
const loginForm = document.getElementById('login-form');
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const cancelEditBtn = document.createElement('button');
cancelEditBtn.textContent = 'Cancel Edit';
cancelEditBtn.style.display = 'none';
cancelEditBtn.onclick = () => {
    productForm.reset();
    isEditing = false;
    editingProductId = null;
    cancelEditBtn.style.display = 'none';
};
productForm.appendChild(cancelEditBtn);
const registerBtn = document.getElementById('register-btn');
const registerModal = document.getElementById('register-modal');
const registerForm = document.getElementById('register-form');
const adminDashboard = document.getElementById('admin-dashboard');
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const logoutBtn = document.getElementById('logout-btn');

// Fetch Products
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        renderUserProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Función para verificar y mantener la sesión
async function checkSession() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginPage();
        return false;
    }
    return true;
}

// Función para mostrar la página de login
function showLoginPage() {
    loginSection.style.display = 'block';
    mainSection.style.display = 'none';
    adminDashboard.style.display = 'none';
}

// Función para mostrar la página principal
function showMainPage(role) {
    loginSection.style.display = 'none';
    mainSection.style.display = 'block';
    adminDashboard.style.display = role === 'admin' ? 'block' : 'none';
}

// User Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const loginType = document.querySelector('input[name="login-type"]:checked').value;

    try {
        const endpoint = loginType === 'admin' ? '/auth/admin/login' : '/auth/user/login';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);
            currentUser = { username, role: data.role };
            showMainPage(data.role);
            await loadProducts(data.role);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
});

// User Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const registerType = document.querySelector('input[name="register-type"]:checked').value;

    try {
        const endpoint = registerType === 'admin' ? '/auth/admin/register' : '/auth/user/register';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please log in.');
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
    }
});

// Load Products
async function loadProducts(role = null) {
    if (!role) {
        role = localStorage.getItem('userRole');
    }
    if (!await checkSession()) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                showLoginPage();
                return;
            }
            throw new Error('Failed to fetch products');
        }

        const products = await response.json();
        if (role === 'admin') {
            renderAdminProducts(products);
        } else {
            renderUserProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProductCard(product, isAdmin = false) {
    const card = document.createElement('div');
    card.classList.add('product-card');
    
    // URL base para las imágenes
    const baseUrl = 'http://localhost:3000'; // Ajusta esto según tu configuración
    const defaultImageUrl = '/default-product.jpg'; // Imagen por defecto
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.imageUrl ? baseUrl + product.imageUrl : defaultImageUrl}" 
                 alt="${product.name}"
                 onerror="this.src='${defaultImageUrl}'">
        </div>
        <div class="product-details">
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
            <div class="product-description">${product.description || ''}</div>
            <div class="product-stock">Stock: ${product.stock || 0}</div>
            ${product.category ? `<div class="product-category">Categoría: ${product.category}</div>` : ''}
        </div>
        <div class="product-actions">
            ${isAdmin ? `
                <button class="btn-edit" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">Eliminar</button>
            ` : ''}
        </div>
    `;
    return card;
}

function renderUserProducts(products) {
    const productList = document.getElementById('product-list');
    productList.classList.add('product-grid');
    productList.innerHTML = '';
    products.forEach(product => {
        const productCard = renderProductCard(product);
        productList.appendChild(productCard);
    });
}

function renderAdminProducts(products) {
    const productList = document.getElementById('product-list');
    productList.classList.add('product-grid');
    productList.innerHTML = '';
    products.forEach(product => {
        const productCard = renderProductCard(product, true);
        productList.appendChild(productCard);
    });
}

// Add/Edit Product (Admin)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!await checkSession()) return;

    try {
        const formData = new FormData();
        
        // Obtener los valores de los campos
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = document.getElementById('product-price').value;
        const stock = document.getElementById('product-stock').value;
        const category = document.getElementById('product-category').value;
        const imageInput = document.getElementById('product-image');

        // Validar campos requeridos
        if (!name || !price) {
            alert('El nombre y el precio son obligatorios');
            return;
        }

        // Agregar los campos al FormData
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('stock', stock);
        formData.append('category', category);

        // Agregar la imagen si existe
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }

        const token = localStorage.getItem('token');
        let response, data;

        // Determinar si es una edición o un nuevo producto
        if (isEditing && editingProductId) {
            // Editar producto existente
            response = await fetch(`${API_URL}/products/${editingProductId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        } else {
            // Agregar nuevo producto
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        }

        data = await response.json();

        if (response.ok) {
            alert(isEditing ? 'Producto actualizado exitosamente' : 'Producto agregado exitosamente');
            productForm.reset();
            
            // Resetear estado de edición
            isEditing = false;
            editingProductId = null;
            cancelEditBtn.style.display = 'none';

            await loadProducts('admin');
        } else {
            throw new Error(data.message || 'Error al procesar el producto');
        }
    } catch (error) {
        console.error('Error processing product:', error);
        alert(error.message || 'Error al procesar el producto');
    }
});

// Edit Product (Admin)
window.editProduct = async (productId) => {
    if (!await checkSession()) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                showLoginPage();
                return;
            }
            throw new Error('Failed to fetch product');
        }

        const product = await response.json();
        
        // Marcar que estamos en modo edición
        isEditing = true;
        editingProductId = productId;

        // Rellenar el formulario con los datos del producto
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-category').value = product.category;

        // Mostrar botón de cancelar edición
        cancelEditBtn.style.display = 'block';
    } catch (error) {
        console.error('Error fetching product:', error);
        alert(error.message || 'An error occurred while fetching the product');
    }
};

// Delete Product (Admin)
window.deleteProduct = async (productId) => {
    if (!await checkSession()) return;
    
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                showLoginPage();
                return;
            }
            throw new Error('Failed to delete product');
        }

        alert('Product deleted successfully');
        await loadProducts('admin');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.message || 'An error occurred while deleting the product');
    }
};

// Check session on page load
window.addEventListener('load', async () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role) {
        showMainPage(role);
        await loadProducts(role);
    } else {
        showLoginPage();
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    showLoginPage();
});

// Handle login type change
document.querySelectorAll('input[name="login-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const showRegisterLink = document.querySelector('#login-form p');
        if (e.target.value === 'admin') {
            showRegisterLink.style.display = 'none';
        } else {
            showRegisterLink.style.display = 'block';
        }
    });
});

// Toggle between login and register forms
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Initial load
fetchProducts();
