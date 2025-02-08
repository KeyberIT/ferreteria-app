const API_URL = 'http://localhost:3000/api';
let token = null;
let currentUser = null;
let isEditing = false;
let editingProductId = null;
// Variables globales para el carrito
let cart = [];
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartContainer = document.getElementById('cart-container');

// DOM Elements
const productsGrid = document.getElementById('product-list');
const loginModal = document.getElementById('login-modal');
const adminModal = document.getElementById('admin-modal');
const loginBtn = document.getElementById('login-btn');
const loginForm = document.getElementById('login-form');
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const cancelEditBtn = document.createElement('button');
cancelEditBtn.textContent = 'Cancelar Edición';
cancelEditBtn.classList.add('btn', 'btn-secondary', 'cancel-edit-btn');
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
    cartContainer.style.display = 'none';
}

// Función para mostrar la página principal
function showMainPage(role) {
    loginSection.style.display = 'none';
    mainSection.style.display = 'block';
    adminDashboard.style.display = role === 'admin' ? 'block' : 'none';
    
    // Mostrar carrito solo para usuarios normales
    if (currentUser && currentUser.role === 'user') {
        cartContainer.style.display = 'block';
    } else {
        cartContainer.style.display = 'none';
    }
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
    const registerType = document.querySelector('input[name="register-type"]').value;

    try {
        const endpoint = registerType === 'admin' ? '/auth/admin/register' : '/auth/user/register';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log('Registration details:', { username, registerType });
        console.log('Register form:', registerForm);
        console.log('API URL:', `${API_URL}${endpoint}`);

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
    const baseUrl = 'http://localhost:3000';
    const defaultImageUrl = '/default-product.jpg';

    // Verificar que el producto tenga un ID válido
    if (!product.id && !product._id) {
        console.error('Producto sin ID:', product);
        return null;
    }

    // Usar el ID correcto (puede ser id o _id dependiendo del backend)
    const productId = product.id || product._id;

    const productCard = document.createElement('div');
    productCard.classList.add('product-card');
    
    const productContent = `
        <div class="product-image">
            <img src="${product.imageUrl ? baseUrl + product.imageUrl : defaultImageUrl}" 
                 alt="${product.name}"
                 onerror="this.src='${defaultImageUrl}'">
        </div>
        <div class="product-details">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
            <p class="product-description">${product.description || 'Sin descripción'}</p>
            <div class="product-stock">Stock: ${product.stock || 0}</div>
            ${product.category ? `<div class="product-category">Categoría: ${product.category}</div>` : ''}
            <div class="product-actions">
                ${isAdmin ? `
                    <button class="btn btn-primary" onclick="editProduct('${productId}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger" onclick="deleteProduct('${productId}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        <i class="fas fa-cart-plus"></i> Agregar al carrito
                    </button>
                `}
            </div>
        </div>
    `;
    
    productCard.innerHTML = productContent;
    return productCard;
}

function renderUserProducts(products) {
    console.log('Renderizando productos para usuario:', products);
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    container.classList.add('products-container');
    
    products.forEach(product => {
        const card = renderProductCard(product, false);
        if (card) {
            container.appendChild(card);
        }
    });
}

function renderAdminProducts(products) {
    console.log('Renderizando productos para admin:', products);
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    container.classList.add('products-container');
    
    products.forEach(product => {
        const card = renderProductCard(product, true);
        if (card) {
            container.appendChild(card);
        }
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
        let url = `${API_URL}/products`;
        let method = 'POST';

        // Determinar si es una edición o un nuevo producto
        if (isEditing && editingProductId) {
            url = `${API_URL}/products/${editingProductId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                showLoginPage();
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el producto');
        }

        const data = await response.json();
        
        alert(isEditing ? 'Producto actualizado exitosamente' : 'Producto agregado exitosamente');
        productForm.reset();
        
        // Resetear estado de edición
        isEditing = false;
        editingProductId = null;
        cancelEditBtn.style.display = 'none';

        // Limpiar la vista previa de la imagen
        const imagePreview = document.getElementById('image-preview');
        const previewText = document.getElementById('preview-text');
        if (previewText) {
            previewText.textContent = 'Vista previa';
        }
        imagePreview.style.display = 'none';

        // Recargar la lista de productos
        await loadProducts('admin');
    } catch (error) {
        console.error('Error processing product:', error);
        alert(error.message || 'Error al procesar el producto');
    }
});

// Edit Product (Admin)
async function editProduct(productId) {
    if (!productId) {
        console.error('ID de producto no válido:', productId);
        alert('Error: ID de producto no válido');
        return;
    }

    if (!await checkSession()) return;

    try {
        console.log('Intentando editar producto con ID:', productId);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'GET',
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
            throw new Error('Failed to fetch product details');
        }

        const product = await response.json();
        console.log('Producto cargado para edición:', product);

        // Llenar el formulario con los detalles del producto
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-stock').value = product.stock || '';
        document.getElementById('product-category').value = product.category || '';

        // Si hay una imagen previa, mostrarla
        const imagePreview = document.getElementById('image-preview');
        const previewText = document.getElementById('preview-text');
        if (product.imageUrl) {
            imagePreview.src = `${API_URL}${product.imageUrl}`;
            imagePreview.style.display = 'block';
            if (previewText) {
                previewText.textContent = 'Vista previa de la imagen';
            }
        } else {
            imagePreview.style.display = 'none';
            if (previewText) {
                previewText.textContent = 'Vista previa';
            }
        }

        isEditing = true;
        editingProductId = productId;

        // Mostrar el botón de cancelar
        cancelEditBtn.style.display = 'inline-block';

        // Hacer scroll al formulario
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing product:', error);
        alert('No se pudo cargar el producto para edición');
    }
}

// Asegurarnos de que la función esté disponible globalmente
window.editProduct = editProduct;

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

// Funcionalidad del Carrito de Compras
function addToCart(product) {
    // Verificar si el usuario está logueado y es un usuario normal
    if (!currentUser || currentUser.role !== 'user') {
        alert('Debes iniciar sesión como usuario para agregar productos al carrito');
        return;
    }

    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    updateCartVisibility();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function clearCart() {
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    // Calcular el total de la compra
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Confirmar la compra
    const confirmar = confirm(`¿Deseas confirmar tu compra por $${total.toFixed(2)}?`);
    
    if (confirmar) {
        const numeroOrden = Math.floor(Math.random() * 1000000);
        cart = [];
        updateCart();
        alert(`¡Compra exitosa!\nNúmero de orden: #${numeroOrden}\nGracias por tu compra.`);
    }
}

function updateCart() {
    // Limpiar el contenedor del carrito
    cartItemsContainer.innerHTML = '';
    
    // Calcular el total
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Renderizar los elementos del carrito
    cart.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.classList.add('cart-item');
        cartItemElement.innerHTML = `
            <div class="cart-item-details">
                <span>${item.name}</span>
                <span>$${item.price} x ${item.quantity}</span>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Eliminar</button>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Actualizar el total
    cartTotalElement.textContent = total.toFixed(2);
}

// Evento para vaciar el carrito
document.getElementById('clear-cart').addEventListener('click', clearCart);

// Función para manejar la visibilidad del carrito
function updateCartVisibility() {
    if (currentUser && currentUser.role === 'user') {
        cartContainer.style.display = 'block';
    } else {
        cartContainer.style.display = 'none';
    }
}

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

// Obtener referencia al input de imagen
const imageInput = document.getElementById('product-image');
const imagePreview = document.createElement('div');
imagePreview.id = 'image-preview';
imagePreview.style.display = 'none';
imagePreview.style.maxWidth = '100px';
imagePreview.style.maxHeight = '100px';
imagePreview.style.margin = '5px 0';
imagePreview.style.alignSelf = 'center';

const previewImage = document.createElement('img');
previewImage.style.width = '100%';
previewImage.style.height = '100%';
previewImage.style.objectFit = 'cover';
previewImage.style.borderRadius = '4px';

const previewText = document.createElement('span');
previewText.textContent = 'Vista previa';
previewText.style.display = 'block';
previewText.style.fontSize = '0.8em';
previewText.style.color = '#666';
previewText.style.textAlign = 'center';
previewText.style.marginTop = '5px';

imagePreview.appendChild(previewImage);
imagePreview.appendChild(previewText);
imageInput.parentNode.insertBefore(imagePreview, imageInput.nextSibling);

// Agregar evento para vista previa de imagen
imageInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            imagePreview.style.display = 'flex';
            if (previewText) {
                previewText.textContent = file.name; // Mostrar nombre del archivo
            }
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.style.display = 'none';
        if (previewText) {
            previewText.textContent = 'Vista previa';
        }
    }
});

// Inicialmente ocultar el carrito
cartContainer.style.display = 'none';
