// Data Models
const API_BASE = '/api';

const menuItems = [
    { id: '1', name: 'Biryani', price: 150, image: 'images/biryani.png' },
    { id: '2', name: 'Coke', price: 40, image: 'images/coke.png' },
    { id: '3', name: 'Veg Meals', price: 100, image: 'images/veg_meals.png' },
    { id: '4', name: 'Noodles', price: 90, image: 'images/noodles.png' },
    { id: '5', name: 'Chocolates', price: 50, image: 'images/chocolates.png' },
    { id: '6', name: 'Chocolate Milkshake', price: 80, image: 'images/chocolate_milkshake.png' },
    { id: '7', name: 'Dosa', price: 60, image: 'images/dosa.png' },
    { id: '8', name: 'Idli', price: 45, image: 'images/idli.png' }
];

let currentUser = null;
let cart = [];
let currentOrder = null;
let timerInterval = null;

// DOM Elements
const screens = {
    login: document.getElementById('login-screen'),
    menu: document.getElementById('menu-screen'),
    cart: document.getElementById('cart-screen'),
    payment: document.getElementById('payment-screen'),
    tracking: document.getElementById('tracking-screen')
};

// Navigation
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
    window.scrollTo(0,0);
}

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    cart = [];
    currentOrder = null;
    updateCartCount();
    document.getElementById('login-form').reset();
    showScreen('login');
});

document.getElementById('tracking-top-back-btn').addEventListener('click', () => {
    showScreen('menu');
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const rollNumber = document.getElementById('roll-number').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rollNumber })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            document.getElementById('user-greeting-name').textContent = currentUser.name;
            renderMenu();
            showScreen('menu');
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
    }
});

// Menu
function renderMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    
    menuItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'food-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="food-img">
            <div class="food-info">
                <div class="food-name">${item.name}</div>
                <div class="food-price">₹${item.price}</div>
                <button class="btn add-btn" onclick="addToCart('${item.id}')">Add to Cart</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.addToCart = function(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    const existing = cart.find(i => i.id === itemId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Cart screen
document.getElementById('view-cart-btn').addEventListener('click', () => {
    renderCart();
    showScreen('cart');
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    showScreen('menu');
});

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
        totalEl.textContent = '0';
        document.getElementById('place-order-btn').disabled = true;
        return;
    }
    
    document.getElementById('place-order-btn').disabled = false;
    container.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price} x ${item.quantity}</div>
            </div>
            <div class="cart-controls">
                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    totalEl.textContent = total;
}

window.updateQty = function(itemId, delta) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== itemId);
    }
    
    updateCartCount();
    renderCart();
};

// Payment & Checkout
document.getElementById('place-order-btn').addEventListener('click', () => {
    if (cart.length === 0) return;
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Setup Payment screen
    document.getElementById('payment-amount').textContent = totalAmount;
    
    // Generate UPI QR Code URL
    const upiId = 'canteen@upi'; // Default/placeholder UPI
    const upiUrl = `upi://pay?pa=${upiId}&pn=Cafeteria&am=${totalAmount}&am=IN&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    
    document.getElementById('qr-code-img').src = qrImageUrl;
    
    showScreen('payment');
});

document.getElementById('back-to-cart-btn').addEventListener('click', () => {
    showScreen('cart');
});

document.getElementById('confirm-payment-btn').addEventListener('click', async () => {
    // Prevent double clicking
    const btn = document.getElementById('confirm-payment-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                items: cart,
                totalAmount
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            cart = []; // clear cart
            updateCartCount();
            currentOrder = data.order;
            startTracking();
        } else {
            alert(data.error || 'Failed to place order');
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirm Payment (I Have Paid)';
    }
});

document.getElementById('cash-payment-btn').addEventListener('click', async () => {
    // Prevent double clicking
    const btn = document.getElementById('cash-payment-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                items: cart,
                totalAmount
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            cart = []; // clear cart
            updateCartCount();
            currentOrder = data.order;
            startTracking();
        } else {
            alert(data.error || 'Failed to place order');
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Cash on Delivery (Pay at Canteen)';
    }
});

function startTracking() {
    showScreen('tracking');
    document.getElementById('display-order-id').textContent = '#' + currentOrder._id.substring(18); // short id
    
    // reset UI
    document.getElementById('status-spinner').style.display = 'block';
    document.getElementById('timer-container').classList.remove('hidden');
    document.getElementById('ready-message').classList.add('hidden');
    document.getElementById('order-status-text').textContent = 'Preparing your order...';
    
    const estimatedTime = new Date(currentOrder.estimatedReadyTime).getTime();
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = estimatedTime - now;
        
        if (distance <= 0) {
            clearInterval(timerInterval);
            orderReady();
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById('countdown-timer').innerHTML = 
                String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
        }
    }, 1000);
}

function orderReady() {
    document.getElementById('status-spinner').style.display = 'none';
    document.getElementById('timer-container').classList.add('hidden');
    document.getElementById('ready-message').classList.remove('hidden');
    document.getElementById('order-status-text').textContent = 'Order Ready!';
}

document.getElementById('tracking-back-btn').addEventListener('click', () => {
    showScreen('menu');
});

document.getElementById('cancel-order-btn').addEventListener('click', async () => {
    if (!currentOrder) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${currentOrder._id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            if (timerInterval) clearInterval(timerInterval);
            currentOrder = null;
            document.getElementById('order-status-text').textContent = 'Order Cancelled';
            alert('Order cancelled successfully.');
            showScreen('menu');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to cancel order');
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error');
    }
});
