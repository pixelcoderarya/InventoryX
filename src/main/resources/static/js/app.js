/**
 * InventoryX | Premium Management Application Logic
 */

// Global State
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentTab = 'products';
let products = [];
let suppliers = [];
let transactions = [];
let users = [];

// API Configuration - Use relative path for robustness
const API_BASE_URL = '/api';
console.log('App Initialized. API Base:', API_BASE_URL);

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    if (authToken && currentUser) {
        showMainApp();
    } else {
        showAuthPage('login');
    }
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingOverlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 500);
    }, 1000);
}

// --- Navigation & UI ---
function showAuthPage(page) {
    document.getElementById('loginModal').style.display = page === 'login' ? 'flex' : 'none';
    document.getElementById('registerModal').style.display = page === 'register' ? 'flex' : 'none';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    document.getElementById('userDisplayName').textContent = currentUser.username;
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    
    // Default to products
    switchTab('products');
    loadDashboardData();
    startStockMonitor();
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });
    
    // Update Content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    // Update Header
    const titles = {
        products: { title: 'Product Portfolio', subtitle: 'Manage and monitor your inventory levels' },
        suppliers: { title: 'Supply Network', subtitle: 'Coordinate with your global vendors' },
        transactions: { title: 'Stock Movements', subtitle: 'Track every stock in, stock out, sale and purchase' },
        team: { title: 'Team Access', subtitle: 'Control system privileges and roles' }
    };
    
    document.getElementById('currentTabTitle').textContent = titles[tabName].title;
    document.getElementById('currentTabSubtitle').textContent = titles[tabName].subtitle;
    
    // Update Add Button
    const addBtn = document.getElementById('addBtn');
    const addBtnText = document.getElementById('addBtnText');
    if (tabName === 'products') {
        addBtn.style.display = 'flex';
        addBtnText.textContent = 'Add Product';
    } else if (tabName === 'team') {
        addBtn.style.display = 'flex';
        addBtnText.textContent = 'Add Member';
    } else {
        addBtn.style.display = 'none';
    }
    
    loadTabData(tabName);
}

// --- API Helpers ---
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        
        if (response.status === 401 || response.status === 403) {
            // handleLogout();
            // throw new Error('Session expired');
        }
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `Error ${response.status}`);
        }
        
        return response.status !== 204 ? await response.json() : null;
    } catch (err) {
        showToast(err.message, 'danger');
        throw err;
    }
}

// --- Data Loading ---
async function loadDashboardData() {
    loadTabData('products');
}

async function loadTabData(tab) {
    switch(tab) {
        case 'products': await fetchProducts(); break;
        case 'suppliers': await fetchSuppliers(); break;
        case 'transactions': await fetchTransactions(); break;
        case 'team': await fetchUsers(); break;
    }
}

async function fetchProducts() {
    products = await apiRequest('/products');
    renderProducts();
    updateStats();
}

async function fetchSuppliers() {
    suppliers = await apiRequest('/suppliers');
    renderSuppliers();
}

async function fetchTransactions() {
    transactions = await apiRequest('/transactions');
    renderTransactions();
}

async function fetchUsers() {
    users = await apiRequest('/users');
    renderUsers();
}

// --- Rendering ---
function renderProducts(filteredList = null) {
    const listToRender = filteredList || products;
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = listToRender.map(p => {
        const status = p.qty <= 5 ? 'danger' : p.qty <= 15 ? 'warning' : 'success';
        const statusText = p.qty <= 5 ? 'Critical' : p.qty <= 15 ? 'Low' : 'Healthy';
        
        return `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="main-text">${p.name}</span>
                        <span class="sub-text">SKU: ${p.sku} • ${p.category}</span>
                    </div>
                </td>
                <td>
                    <div class="cell-numeric">$${p.price.toFixed(2)}</div>
                </td>
                <td>
                    <div class="cell-status">
                        <span class="badge badge-${status}">${statusText}</span>
                        <span class="sub-text"><strong>${p.qty}</strong> in stock</span>
                    </div>
                </td>
                <td class="text-right">
                    <div class="action-buttons">
                        <button onclick="quickStockIn(${p.id})" class="btn-icon stock-in-btn" title="Stock In"><i class="fas fa-arrow-down"></i></button>
                        <button onclick="quickStockOut(${p.id})" class="btn-icon stock-out-btn" title="Stock Out / Sell"><i class="fas fa-arrow-up"></i></button>
                        <button onclick="editProduct(${p.id})" class="btn-icon" title="Edit"><i class="fas fa-pen"></i></button>
                        <button onclick="deleteProduct(${p.id})" class="btn-icon danger" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');
    tbody.innerHTML = suppliers.map(s => `
        <tr>
            <td>
                <div class="cell-primary">
                    <span class="main-text">${s.name}</span>
                    <span class="sub-text">${s.contact}</span>
                </div>
            </td>
            <td>
                <div class="cell-details">
                    <span class="main-text">${s.email}</span>
                    <span class="sub-text">${s.phone}</span>
                </div>
            </td>
            <td>
                <div class="cell-muted">${s.address || 'N/A'}</div>
            </td>
            <td class="text-right">
                <div class="action-buttons">
                    <button onclick="editSupplier(${s.id})" class="btn-icon"><i class="fas fa-pen"></i></button>
                    <button onclick="deleteSupplier(${s.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderTransactions(filteredList = null) {
    const listToRender = filteredList || transactions;
    const tbody = document.getElementById('transactionsTableBody');

    const typeConfig = {
        'STOCK_IN':    { label: 'Stock In',   badge: 'badge-success',   icon: 'fa-arrow-down' },
        'STOCK_OUT':   { label: 'Stock Out',  badge: 'badge-danger',    icon: 'fa-arrow-up' },
        'SALE':        { label: 'Sale',        badge: 'badge-warning',   icon: 'fa-shopping-cart' },
        'PURCHASE':    { label: 'Purchase',    badge: 'badge-info',      icon: 'fa-truck' },
        'RETURN':      { label: 'Return',      badge: 'badge-purple',    icon: 'fa-undo' },
        'ADJUSTMENT':  { label: 'Adjustment',  badge: 'badge-secondary', icon: 'fa-sliders-h' }
    };

    tbody.innerHTML = listToRender.slice().reverse().map(t => {
        const cfg = typeConfig[t.type] || { label: t.type, badge: 'badge-secondary', icon: 'fa-circle' };
        const isInbound = ['STOCK_IN', 'PURCHASE', 'RETURN'].includes(t.type);
        const qtyClass = isInbound ? 'qty-in' : 'qty-out';
        const qtyPrefix = isInbound ? '+' : '-';
        const dateStr = new Date(t.date || t.createdAt).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });

        return `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="main-text">${t.product ? t.product.name : 'Unknown Product'}</span>
                        <span class="sub-text">${t.product ? 'SKU: ' + t.product.sku : ''}</span>
                    </div>
                </td>
                <td>
                    <span class="badge ${cfg.badge}"><i class="fas ${cfg.icon}" style="margin-right:4px;"></i>${cfg.label}</span>
                </td>
                <td>
                    <span class="movement-qty ${qtyClass}">${qtyPrefix}${t.qty}</span>
                </td>
                <td>
                    <div class="cell-muted">${t.notes || t.batchNumber || '-'}</div>
                </td>
                <td>
                    <div class="cell-muted">${t.user ? t.user.username : 'System'}</div>
                </td>
                <td>
                    <div class="cell-muted">${dateStr}</div>
                </td>
            </tr>
        `;
    }).join('');

    updateMovementSummary(listToRender);
}

function updateMovementSummary(txList) {
    const sum = (type) => txList.filter(t => t.type === type).reduce((s, t) => s + t.qty, 0);
    document.getElementById('totalStockIn').textContent = sum('STOCK_IN');
    document.getElementById('totalStockOut').textContent = sum('STOCK_OUT');
    document.getElementById('totalSales').textContent = sum('SALE');
    document.getElementById('totalPurchases').textContent = sum('PURCHASE');
}

function renderUsers(filteredList = null) {
    const listToRender = filteredList || users;
    const tbody = document.getElementById('teamTableBody');
    tbody.innerHTML = listToRender.map(u => `
        <tr>
            <td>
                <div class="cell-primary">
                    <span class="main-text">${u.username}</span>
                    <span class="sub-text">ID: #${u.id}</span>
                </div>
            </td>
            <td><span class="badge badge-success">${u.role}</span></td>
            <td class="text-right">
                <button onclick="deleteUser(${u.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    document.getElementById('statTotalProducts').textContent = products.length;
    const lowStock = products.filter(p => p.qty <= 10).length;
    document.getElementById('statLowStock').textContent = lowStock;
}

// --- Modals ---
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function showAddUserModal() {
    document.getElementById('userForm').reset();
    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function showAddSupplierModal() {
    document.getElementById('supplierModalTitle').textContent = 'Add New Supplier';
    document.getElementById('supplierForm').reset();
    document.getElementById('supplierId').value = '';
    document.getElementById('supplierModal').style.display = 'flex';
}

function closeSupplierModal() {
    document.getElementById('supplierModal').style.display = 'none';
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const body = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        qty: parseInt(document.getElementById('productQuantity').value)
    };

    try {
        if (id) {
            await apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            showToast('Product updated successfully');
        } else {
            await apiRequest('/products', { method: 'POST', body: JSON.stringify(body) });
            showToast('Product added successfully');
        }
        closeProductModal();
        fetchProducts();
    } catch (err) {}
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const body = {
        username: document.getElementById('newMemberUsername').value,
        password: document.getElementById('newMemberPassword').value,
        role: document.getElementById('userRole').value
    };

    try {
        await apiRequest('/users', { method: 'POST', body: JSON.stringify(body) });
        showToast('Team member added successfully');
        closeUserModal();
        fetchUsers();
    } catch (err) {}
}

async function handleSupplierSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('supplierId').value;
    const body = {
        name: document.getElementById('supplierName').value,
        contact: document.getElementById('supplierContact').value,
        email: document.getElementById('supplierEmail').value,
        phone: document.getElementById('supplierPhone').value,
        address: document.getElementById('supplierAddress').value
    };

    try {
        if (id) {
            await apiRequest(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            showToast('Supplier updated successfully');
        } else {
            await apiRequest('/suppliers', { method: 'POST', body: JSON.stringify(body) });
            showToast('Supplier added successfully');
        }
        closeSupplierModal();
        fetchSuppliers();
    } catch (err) {}
}

async function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productSku').value = p.sku;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productQuantity').value = p.qty;
    document.getElementById('productModal').style.display = 'flex';
}

async function editSupplier(id) {
    const s = suppliers.find(sup => sup.id === id);
    if (!s) return;
    
    document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
    document.getElementById('supplierId').value = s.id;
    document.getElementById('supplierName').value = s.name;
    document.getElementById('supplierContact').value = s.contact;
    document.getElementById('supplierEmail').value = s.email;
    document.getElementById('supplierPhone').value = s.phone;
    document.getElementById('supplierAddress').value = s.address;
    document.getElementById('supplierModal').style.display = 'flex';
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await apiRequest(`/products/${id}`, { method: 'DELETE' });
            showToast('Product deleted');
            fetchProducts();
        } catch (err) {}
    }
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to remove this team member?')) {
        try {
            await apiRequest(`/users/${id}`, { method: 'DELETE' });
            showToast('Member removed');
            fetchUsers();
        } catch (err) {}
    }
}

// --- Stock Movement Modal ---
function showStockMovementModal(preselectedProductId = null, preselectedType = null) {
    document.getElementById('stockMovementForm').reset();
    
    // Populate product dropdown
    const select = document.getElementById('movementProductId');
    select.innerHTML = '<option value="">-- Choose a product --</option>';
    products.forEach(p => {
        select.innerHTML += `<option value="${p.id}" data-stock="${p.qty}">${p.name} (SKU: ${p.sku}) — ${p.qty} in stock</option>`;
    });
    
    if (preselectedProductId) {
        select.value = preselectedProductId;
        updateStockPreview();
    }
    
    if (preselectedType) {
        const radio = document.querySelector(`input[name="movementType"][value="${preselectedType}"]`);
        if (radio) radio.checked = true;
    }
    
    document.getElementById('stockMovementModal').style.display = 'flex';
}

function closeStockMovementModal() {
    document.getElementById('stockMovementModal').style.display = 'none';
}

function updateStockPreview() {
    const select = document.getElementById('movementProductId');
    const preview = document.getElementById('productStockPreview');
    const qtySpan = document.getElementById('previewStockQty');
    
    const selectedOption = select.options[select.selectedIndex];
    if (select.value && selectedOption) {
        const stock = selectedOption.getAttribute('data-stock');
        qtySpan.textContent = stock;
        preview.style.display = 'flex';
    } else {
        preview.style.display = 'none';
    }
}

async function handleStockMovementSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('movementProductId').value;
    const qty = parseInt(document.getElementById('movementQty').value);
    const type = document.querySelector('input[name="movementType"]:checked').value;
    const notes = document.getElementById('movementNotes').value;
    const batchNumber = document.getElementById('movementBatchNumber').value;
    
    if (!productId || !qty || qty <= 0) {
        showToast('Please select a product and enter a valid quantity', 'danger');
        return;
    }
    
    const body = {
        product: { id: parseInt(productId) },
        user: { id: currentUser.id },
        qty: qty,
        type: type,
        notes: notes || null,
        batchNumber: batchNumber || null
    };
    
    try {
        await apiRequest('/transactions', { method: 'POST', body: JSON.stringify(body) });
        
        const typeLabels = {
            'STOCK_IN': 'Stock In', 'STOCK_OUT': 'Stock Out', 'SALE': 'Sale',
            'PURCHASE': 'Purchase', 'RETURN': 'Return', 'ADJUSTMENT': 'Adjustment'
        };
        showToast(`${typeLabels[type]} of ${qty} units recorded successfully!`);
        closeStockMovementModal();
        
        // Refresh data
        await fetchProducts();
        await fetchTransactions();
    } catch (err) {
        // Error already shown by apiRequest
    }
}

// Quick Stock In/Out from Products Table
function quickStockIn(productId) {
    showStockMovementModal(productId, 'STOCK_IN');
}

function quickStockOut(productId) {
    showStockMovementModal(productId, 'STOCK_OUT');
}

// --- Transaction Filtering ---
function filterTransactions() {
    const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    
    let filtered = transactions;
    
    if (typeFilter) {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(t => {
            const productName = t.product ? t.product.name.toLowerCase() : '';
            const userName = t.user ? t.user.username.toLowerCase() : '';
            const notes = t.notes ? t.notes.toLowerCase() : '';
            return productName.includes(searchTerm) || userName.includes(searchTerm) || notes.includes(searchTerm);
        });
    }
    
    renderTransactions(filtered);
}

// --- Events ---
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('registerBtn').addEventListener('click', () => showAuthPage('register'));
    document.getElementById('backToLoginBtn').addEventListener('click', () => showAuthPage('login'));
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });
    
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    document.getElementById('supplierForm').addEventListener('submit', handleSupplierSubmit);
    document.getElementById('stockMovementForm').addEventListener('submit', handleStockMovementSubmit);
    
    // Product stock preview on select change
    document.getElementById('movementProductId').addEventListener('change', updateStockPreview);
    
    // Chatbot
    document.getElementById('toggleChat').addEventListener('click', toggleChat);
    document.getElementById('closeChat').addEventListener('click', toggleChat);
    document.getElementById('sendMessage').addEventListener('click', handleChat);
    document.getElementById('chatInput').addEventListener('keypress', (e) => e.key === 'Enter' && handleChat());
    
    // Search listeners
    document.getElementById('productSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
        renderProducts(filtered);
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        const cat = e.target.value;
        const filtered = cat ? products.filter(p => p.category === cat) : products;
        renderProducts(filtered);
    });
    
    document.getElementById('teamSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = users.filter(u => u.username.toLowerCase().includes(term));
        renderUsers(filtered);
    });
    
    // Transaction search & filter
    document.getElementById('transactionSearch').addEventListener('input', filterTransactions);
    document.getElementById('transactionTypeFilter').addEventListener('change', filterTransactions);
    
    // Header Add Button
    document.getElementById('addBtn').addEventListener('click', () => {
        if (currentTab === 'products') showAddProductModal();
        else if (currentTab === 'team') showAddUserModal();
        else if (currentTab === 'suppliers') showAddSupplierModal();
    });
}

// --- Toast ---
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- Auth Actions ---
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        authToken = data.token;
        currentUser = { username: data.username, role: data.role, id: data.userId };
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMainApp();
        showToast(`Welcome back, ${data.username}!`);
    } catch (err) {}
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;
    
    if (password !== confirm) return showToast('Passwords do not match', 'danger');
    
    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
        showToast('Registration successful! Please sign in.');
        showAuthPage('login');
    } catch (err) {}
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuthPage('login');
}

// --- Chatbot ---
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
        notificationCount = 0;
        updateChatBadge();
    }
}

let notificationCount = 0;

function updateChatBadge() {
    const badge = document.getElementById('chatBadge');
    badge.style.display = notificationCount > 0 ? 'block' : 'none';
    badge.textContent = notificationCount;
}

function addMessage(text, side = 'bot') {
    const chatMessages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${side}`;
    div.innerHTML = `<div class="bubble">${text}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChat() {
    const chatInput = document.getElementById('chatInput');
    const msg = chatInput.value.trim();
    if (!msg) return;
    addMessage(msg, 'user');
    chatInput.value = '';
    
    // Typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.innerHTML = '<div class="bubble"><i class="fas fa-ellipsis fa-beat"></i> Thinking...</div>';
    document.getElementById('chatMessages').appendChild(typingDiv);

    setTimeout(() => {
        typingDiv.remove();
        const lowMsg = msg.toLowerCase();
        let response = "";

        if (lowMsg.includes('hello') || lowMsg.includes('hi')) {
            response = "Hello! I'm your Gemini-powered Inventory Assistant. Ask me about stock levels, suppliers, or product stats!";
        } else if (lowMsg.includes('stock') || lowMsg.includes('inventory')) {
            const critical = products.filter(p => p.qty <= 5);
            const low = products.filter(p => p.qty > 5 && p.qty <= 15);
            response = `📊 Stock Report: <strong>${critical.length}</strong> critical, <strong>${low.length}</strong> low, <strong>${products.length - critical.length - low.length}</strong> healthy.`;
            if (critical.length > 0) response += `<br>🚨 Critical: ${critical.map(p => p.name).join(', ')}`;
        } else if (lowMsg.includes('supplier')) {
            response = `You have <strong>${suppliers.length}</strong> active suppliers.`;
        } else if (lowMsg.includes('total') || lowMsg.includes('value')) {
            const totalValue = products.reduce((sum, p) => sum + (p.price * p.qty), 0);
            response = `Total inventory value: <strong>$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> across ${products.length} products.`;
        } else {
            response = `I have ${products.length} products tracked. Try asking about "stock status", "suppliers", or "total value".`;
        }
        addMessage(response, 'bot');
    }, 1200);
}

// --- Stock Monitor ---
function startStockMonitor() {
    setInterval(async () => {
        if (authToken) {
            try { await fetchProducts(); } catch(e) {}
        }
    }, 30000);
}
