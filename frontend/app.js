const API_URL = 'http://localhost:8080/api';
let currentUser = null;
let authMode = 'login';
let products = [];
let cart = [];
let editingProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuth();
    startTokenExpirationCheck();
    console.log('App initialized');
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const hamburger = document.getElementById('hamburger');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// Page Navigation
function showPage(pageName) {
    // Check if token has expired before showing protected pages
    const token = localStorage.getItem('token');
    const expirationTime = localStorage.getItem('tokenExpiration');

    if (token && expirationTime) {
        const currentTime = new Date().getTime();
        if (currentTime > expirationTime) {
            console.log('Token expired - redirecting to login');
            handleTokenExpiration();
            return;
        }
    }

    // Check if user is trying to access admin panel without admin role
    if (pageName === 'admin' && !isAdmin()) {
        alert('Admin access required. You do not have admin permissions.');
        showPage('home');
        return;
    }

    // Check if user is trying to access protected pages without being logged in
    const protectedPages = ['cart', 'orders', 'admin'];
    if (protectedPages.includes(pageName) && !token) {
        alert('Please login to access this page');
        showPage('login');
        return;
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');
    }

    if (pageName === 'products') {
        loadProducts();
    } else if (pageName === 'cart') {
        loadCart();
    } else if (pageName === 'admin') {
        loadInventory();
    } else if (pageName === 'orders') {
        loadOrders();
    }

    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
}

// Auth Functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const expirationTime = localStorage.getItem('tokenExpiration');

    if (token && user && expirationTime) {
        const currentTime = new Date().getTime();

        // Check if token has expired
        if (currentTime > expirationTime) {
            console.log('Token has expired on page load - clearing user data');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiration');
            currentUser = null;
            updateNavBar();
            return;
        }

        try {
            currentUser = JSON.parse(user);
            console.log('User authenticated:', currentUser);
            console.log('User roles:', currentUser.roles);
            updateNavBar();
        } catch (e) {
            console.error('Error parsing user:', e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiration');
            currentUser = null;
            updateNavBar();
        }
    }
}

function isAdmin() {
    if (!currentUser || !currentUser.roles) {
        console.log('No currentUser or roles');
        return false;
    }
    const isAdminRole = currentUser.roles.includes('ROLE_ADMIN');
    console.log('isAdmin check:', isAdminRole, 'Roles:', currentUser.roles);
    return isAdminRole;
}

function updateNavBar() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    if (currentUser) {
        const adminLink = isAdmin() ? '<li><a href="#" onclick="showPage(\'admin\')">Admin Panel</a></li>' : '';
        navMenu.innerHTML = `
            <li><a href="#" onclick="showPage('home')">Home</a></li>
            <li><a href="#" onclick="showPage('products')">Products</a></li>
            <li><a href="#" onclick="showPage('cart')">Cart</a></li>
            <li><a href="#" onclick="showPage('orders')">Orders</a></li>
            ${adminLink}
            <li><a href="#" onclick="logout()">Logout (${currentUser.email})</a></li>
        `;
    } else {
        navMenu.innerHTML = `
            <li><a href="#" onclick="showPage('home')">Home</a></li>
            <li><a href="#" onclick="showPage('products')">Products</a></li>
            <li><a href="#" onclick="showPage('cart')">Cart</a></li>
            <li><a href="#" onclick="showPage('login')">Login</a></li>
        `;
    }
}

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';

    const authTitle = document.getElementById('authTitle');
    const nameFields = document.getElementById('nameFields');
    const toggleAuth = document.getElementById('toggleAuth');
    const btn = document.querySelector('.auth-box button');

    if (authMode === 'register') {
        if (authTitle) authTitle.textContent = 'Register';
        if (nameFields) nameFields.style.display = 'block';
        if (toggleAuth) toggleAuth.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuthMode()">Login</a>';
        if (btn) btn.textContent = 'Register';
    } else {
        if (authTitle) authTitle.textContent = 'Login';
        if (nameFields) nameFields.style.display = 'none';
        if (toggleAuth) toggleAuth.innerHTML = "Don't have an account? <a href='#' onclick='toggleAuthMode()'>Register</a>";
        if (btn) btn.textContent = 'Login';
    }

    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.reset();
    }
}

function handleAuth(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (authMode === 'login') {
        loginUser(email, password);
    } else {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;

        if (!firstName || !lastName) {
            alert('Please fill in all fields');
            return;
        }

        registerUser(email, password, firstName, lastName);
    }
}

async function registerUser(email, password, firstName, lastName) {
    try {
        console.log('Registering user:', email);

        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName
            })
        });

        console.log('Registration response status:', response.status);

        const data = await response.json();
        console.log('Registration response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: data.roles || ['ROLE_USER']
        }));

        // Set token expiration (24 hours from now)
        const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiration', expirationTime);

        currentUser = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: data.roles || ['ROLE_USER']
        };
        console.log('Current user set:', currentUser);
        updateNavBar();
        showPage('home');
        alert('Registration successful!');
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
}

async function loginUser(email, password) {
    try {
        console.log('Logging in user:', email);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        console.log('Login response status:', response.status);

        const data = await response.json();
        console.log('Login response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: data.roles || ['ROLE_USER']
        }));

        // Set token expiration (24 hours from now)
        const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiration', expirationTime);

        currentUser = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: data.roles || ['ROLE_USER']
        };
        console.log('Current user set:', currentUser);
        updateNavBar();
        showPage('home');
        alert('Login successful!');
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    currentUser = null;
    editingProductId = null;
    updateNavBar();
    showPage('home');
    alert('Logged out successfully');
}

// Product Functions
async function loadProducts() {
    try {
        console.log('Loading products...');

        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
            throw new Error('Failed to load products');
        }

        products = await response.json();
        console.log('Products loaded:', products);
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        const productsList = document.getElementById('productsList');
        if (productsList) {
            productsList.innerHTML = `<p style="color: white;">Error loading products: ${error.message}</p>`;
        }
    }
}

function displayProducts(productsToShow) {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    if (productsToShow.length === 0) {
        productsList.innerHTML = '<p style="color: white;">No products found. Please add products from admin panel.</p>';
        return;
    }

    productsList.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-image">📦</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-description">${product.description || 'No description'}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function searchProducts(keyword) {
    if (!keyword.trim()) {
        displayProducts(products);
        return;
    }

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(keyword.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(keyword.toLowerCase())) ||
        product.category.toLowerCase().includes(keyword.toLowerCase())
    );

    displayProducts(filtered);
}

// Cart Functions
async function addToCart(productId, productName, price) {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please login first');
        showPage('login');
        return;
    }

    try {
        console.log('Adding to cart:', productId, productName, price);

        const response = await fetch(`${API_URL}/cart/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add to cart');
        }

        alert(`${productName} added to cart!`);
        loadCart();
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error: ' + error.message);
    }
}

async function loadCart() {
    const token = localStorage.getItem('token');
    const cartContent = document.getElementById('cartContent');

    if (!cartContent) return;

    if (!token) {
        cartContent.innerHTML = `
            <div class="cart-empty">
                <p>Please <a href="#" onclick="showPage('login')">login</a> to view your cart</p>
            </div>
        `;
        return;
    }

    try {
        console.log('Loading cart...');

        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load cart');
        }

        const cartData = await response.json();
        console.log('Cart data:', cartData);
        displayCart(cartData);
    } catch (error) {
        console.error('Error loading cart:', error);
        cartContent.innerHTML = `<p>Error loading cart: ${error.message}</p>`;
    }
}

function displayCart(cartData) {
    const cartContent = document.getElementById('cartContent');
    if (!cartContent) return;

    if (!cartData.items || cartData.items.length === 0) {
        cartContent.innerHTML = `
            <div class="cart-empty">
                <p>Your cart is empty</p>
                <button class="btn-primary" onclick="showPage('products')">Continue Shopping</button>
            </div>
        `;
        return;
    }

    const itemsHtml = cartData.items.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div>${(item.subtotal).toFixed(2)}</div>
            <button class="btn-secondary" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
    `).join('');

    cartContent.innerHTML = `
        <div class="cart-items">
            ${itemsHtml}
        </div>
        <div class="cart-summary">
            <div class="summary-total">Total: $${cartData.totalPrice.toFixed(2)}</div>
            <button class="btn-checkout" onclick="checkout()">Checkout</button>
        </div>
    `;
}

async function updateQuantity(itemId, newQuantity) {
    const token = localStorage.getItem('token');

    if (newQuantity <= 0) {
        removeFromCart(itemId);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/items/${itemId}?quantity=${newQuantity}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to update quantity');
        }

        loadCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Error: ' + error.message);
    }
}

async function removeFromCart(itemId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to remove item');
        }

        loadCart();
    } catch (error) {
        console.error('Error removing from cart:', error);
        alert('Error: ' + error.message);
    }
}

async function checkout() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please login first');
        return;
    }

    try {
        console.log('Creating order...');

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Checkout failed');
        }

        const order = await response.json();
        console.log('Order created:', order);
        alert(`Order created successfully! Order ID: ${order.id}\n\nYou can view your order in the Orders section.`);
        loadCart();
        showPage('orders');
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Checkout failed: ' + error.message);
    }
}

// Admin Functions
function resetForm() {
    editingProductId = null;
    document.getElementById('productForm').reset();
    document.querySelector('.add-product-form button[type="submit"]').textContent = 'Add Product';
    const formTitle = document.querySelector('.add-product-form h3');
    if (formTitle) formTitle.textContent = 'Add New Product';
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productCategory').value = product.category;

    // Change button text
    const btn = document.querySelector('.add-product-form button[type="submit"]');
    if (btn) btn.textContent = 'Update Product';

    const formTitle = document.querySelector('.add-product-form h3');
    if (formTitle) formTitle.textContent = 'Edit Product';

    // Show cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'block';

    // Scroll to form
    document.querySelector('.add-product-form').scrollIntoView({ behavior: 'smooth' });
}

async function handleAddProduct(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first');
        return;
    }

    const productName = document.getElementById('productName').value;
    const productDescription = document.getElementById('productDescription').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productStock = parseInt(document.getElementById('productStock').value);
    const productCategory = document.getElementById('productCategory').value;

    if (!productName || !productPrice || !productStock || !productCategory) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const url = editingProductId ? `${API_URL}/products/${editingProductId}` : `${API_URL}/products`;
        const method = editingProductId ? 'PUT' : 'POST';

        console.log('Submitting product with method:', method, 'to URL:', url);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: productName,
                description: productDescription,
                price: productPrice,
                stock: productStock,
                category: productCategory
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Operation failed');
        }

        alert(editingProductId ? 'Product updated successfully!' : 'Product added successfully!');
        resetForm();
        loadInventory();
    } catch (error) {
        console.error('Error:', error);
        alert('Operation failed: ' + error.message);
    }
}

async function loadInventory() {
    const token = localStorage.getItem('token');

    if (!token) {
        return;
    }

    try {
        console.log('Loading inventory...');

        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load inventory');
        }

        products = await response.json();
        console.log('Products loaded:', products);
        displayInventory(products);
    } catch (error) {
        console.error('Error loading inventory:', error);
        const inventoryList = document.getElementById('inventoryList');
        if (inventoryList) {
            inventoryList.innerHTML = `<p class="inventory-empty">Error loading inventory: ${error.message}</p>`;
        }
    }
}

function displayInventory(productsList) {
    const inventoryList = document.getElementById('inventoryList');

    if (!inventoryList) return;

    if (productsList.length === 0) {
        inventoryList.innerHTML = '<p class="inventory-empty">No products in inventory</p>';
        return;
    }

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${productsList.map(product => `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td>${product.stock}</td>
                        <td>
                            <div class="actions">
                                <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                                <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    inventoryList.innerHTML = tableHtml;
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        console.log('Deleting product:', productId);

        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        alert('Product deleted successfully!');
        loadInventory();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
    }
}

// Order Functions
async function loadOrders() {
    const token = localStorage.getItem('token');
    const ordersContent = document.getElementById('ordersContent');

    if (!ordersContent) {
        console.log('ordersContent element not found');
        return;
    }

    if (!token) {
        ordersContent.innerHTML = `
            <div class="order-empty">
                <p>Please <a href="#" onclick="showPage('login')">login</a> to view your orders</p>
            </div>
        `;
        return;
    }

    try {
        console.log('Loading orders...');

        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load orders');
        }

        const orders = await response.json();
        console.log('Orders loaded:', orders);
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContent.innerHTML = `<p style="padding: 2rem; text-align: center; color: #999;">Error loading orders: ${error.message}</p>`;
    }
}

function displayOrders(orders) {
    const ordersContent = document.getElementById('ordersContent');
    if (!ordersContent) return;

    if (!orders || orders.length === 0) {
        ordersContent.innerHTML = `
            <div class="order-empty">
                <div class="order-empty-icon">📦</div>
                <p>No orders yet</p>
                <button class="btn-primary" onclick="showPage('products')">
                    Start Shopping
                </button>
            </div>
        `;
        return;
    }

    ordersContent.innerHTML = `
        <div class="orders-grid">
            ${orders.map(order => `
                <div class="order-card">

                    <!-- HEADER -->
                    <div class="order-card-header">
                        <div class="order-card-info">
                            <div class="order-card-id">Order #${order.id}</div>
                            <div class="order-card-date">
                                ${formatDate(order.createdAt)}
                            </div>
                        </div>
                        <span class="status-badge status-${(order.status || 'pending').toLowerCase()}">
                            ${order.status || 'PENDING'}
                        </span>
                    </div>

                    <!-- ITEMS -->
                    <div class="order-card-items">
                        <span class="order-card-items-label">Items</span>
                        <ul class="order-item-list">
                            ${order.items.map(item => `
                                <li class="order-item-list-item">
                                    <div class="order-item-details">
                                        <div class="order-item-name">
                                            ${item.product?.name || 'Product'}
                                        </div>
                                        <div class="order-item-qty">
                                            Qty: ${item.quantity}
                                        </div>
                                    </div>
                                    <div class="order-item-price">
                                        $${((item.subtotal ?? (item.product?.price * item.quantity)) || 0).toFixed(2)}
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- FOOTER -->
                    <div class="order-card-footer">
                        <div class="order-card-total-label">Total</div>
                        <div class="order-card-total">
                            $${(order.totalPrice ?? 0).toFixed(2)}
                        </div>
                    </div>

                </div>
            `).join('')}
        </div>
    `;
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
}

function getStatusClass(status) {
    if (!status) return 'status-pending';
    const statusLower = status.toLowerCase();
    return `status-${statusLower}`;
}

// Token Expiration Check
let expirationWarningShown = false;
let expirationCheckInterval = null;

function startTokenExpirationCheck() {
    // Check token expiration every 10 seconds (more frequent)
    expirationCheckInterval = setInterval(() => {
        checkTokenExpiration();
    }, 10000); // 10 seconds

    // Also check immediately on page load
    checkTokenExpiration();

    // Also check on page visibility change (when user comes back to tab)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkTokenExpiration();
        }
    });
}

function checkTokenExpiration() {
    const token = localStorage.getItem('token');
    const expirationTime = localStorage.getItem('tokenExpiration');

    if (!token || !expirationTime) {
        return;
    }

    const currentTime = new Date().getTime();
    const timeUntilExpiration = expirationTime - currentTime;

    console.log('Token expiration check - Time until expiration:', Math.floor(timeUntilExpiration / 1000), 'seconds');

    if (timeUntilExpiration <= 0) {
        // Token has expired
        console.log('Token expired! Logging out user.');
        handleTokenExpiration();
    } else if (timeUntilExpiration <= 5 * 60 * 1000 && !expirationWarningShown) {
        // Token will expire in 5 minutes or less - warn user (only once)
        showExpirationWarning(timeUntilExpiration);
        expirationWarningShown = true;
    }
}

function handleTokenExpiration() {
    // Clear all user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    currentUser = null;
    editingProductId = null;
    expirationWarningShown = false;

    // Stop the expiration check
    if (expirationCheckInterval) {
        clearInterval(expirationCheckInterval);
    }

    // Update navbar to show login option
    updateNavBar();

    // Show login page
    showPage('login');

    // Show alert
    alert('Your session has expired. Please login again.');
}

function showExpirationWarning(timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    console.warn(`Your session will expire in ${minutes}:${seconds.toString().padStart(2, '0')} minutes`);
}