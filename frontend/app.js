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
        
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Precio: $${product.price}</p>
                <p>Stock: ${product.stock}</p>
            </div>
        `).join('');
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
        productList.innerHTML = `
            <div class="product-grid">
                ${products.map(product => `
                    <div class="product-card">
                        <div class="product-image-placeholder">
                            <img src="${product.imageUrl || 'default-product-image.png'}" alt="${product.name}">
                        </div>
                        <div class="product-details">
                            <h3>${product.name}</h3>
                            <p class="product-description">${product.description}</p>
                            <div class="product-meta">
                                <span class="product-price">Precio: $${product.price.toFixed(2)}</span>
                                <span class="product-stock">Stock: ${product.stock}</span>
                            </div>
                            ${role === 'admin' ? `
                                <div class="product-actions">
                                    <button onclick="editProduct(${product.id})">Editar</button>
                                    <button onclick="deleteProduct(${product.id})">Eliminar</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Mostrar u ocultar el botón de cancelar según el estado de edición
        cancelEditBtn.style.display = isEditing ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Add Product (Admin)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!await checkSession()) return;

    try {
        const token = localStorage.getItem('token');
        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            category: document.getElementById('product-category').value
        };

        let url = `${API_URL}/products`;
        let method = 'POST';

        // Si estamos editando, cambiamos el URL y método
        if (isEditing && editingProductId) {
            url = `${API_URL}/products/${editingProductId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                showLoginPage();
                return;
            }
            const data = await response.json();
            throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'add'} product`);
        }

        alert(`Product ${isEditing ? 'updated' : 'added'} successfully`);
        productForm.reset();
        isEditing = false;
        editingProductId = null;
        await loadProducts('admin');
    } catch (error) {
        console.error(`Error ${isEditing ? 'updating' : 'adding'} product:`, error);
        alert(error.message || `An error occurred while ${isEditing ? 'updating' : 'adding'} the product`);
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
