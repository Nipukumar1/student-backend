// Product Generator - Unlimited Products
const categories = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Toys", "Gaming", "Books", "Automotive", "Groceries"];

const icons = {
    Electronics: "📱",
    Fashion: "👕",
    Home: "🛋️",
    Beauty: "💄",
    Sports: "⚽",
    Toys: "🧸",
    Gaming: "🎮",
    Books: "📚",
    Automotive: "🚗",
    Groceries: "🍎"
};

function createProduct(id) {
    const cat = categories[id % categories.length];
    const names = ["Pro", "Ultra", "Max", "Elite", "Premium", "Neo", "X", "Infinity", "Smart", "Deluxe"];
    const items = ["Phone", "Laptop", "Watch", "Speaker", "Shoes", "Jacket", "Bag", "Camera", "Drone", "Headphones", "Tablet", "Mouse", "Keyboard", "Monitor"];

    const name = `${names[id % names.length]} ${items[id % items.length]} ${Math.floor(id / 12) + 1}`;
    const price = 399 + (id % 297) * 12;

    return {
        id,
        name,
        category: cat,
        price: Math.floor(price / 10) * 10,
        icon: icons[cat] || "🛍️"
    };
}

let masterList = [];
for (let i = 1; i <= 500; i++) {
    masterList.push(createProduct(i));
}

let displayLimit = 12;
let activeCat = "all";
let searchText = "";
let cart = JSON.parse(localStorage.getItem('cartItems')) || [];

// Login check
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// User display
document.getElementById('userNameDisplay').innerHTML = `
    <strong>👋 ${localStorage.getItem('userName') || 'User'}</strong>
    <br>
    <small>${localStorage.getItem('userEmail') || ''}</small>
`;

function getFiltered() {
    let data = [...masterList];

    if (activeCat !== "all") {
        data = data.filter(p => p.category === activeCat);
    }

    if (searchText.trim()) {
        const q = searchText.toLowerCase();
        data = data.filter(
            p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
        );
    }

    return data;
}

function renderProducts() {
    const filtered = getFiltered();

    document.getElementById("productCountSpan").innerHTML = `(${filtered.length} items)`;

    const showItems = filtered.slice(0, displayLimit);
    const grid = document.getElementById("productsGrid");

    if (showItems.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px;">
                ✨ No products found ✨
            </div>
        `;
        document.getElementById("loadMoreWrap").style.display = "none";
        return;
    }

    grid.innerHTML = showItems.map(p => `
        <div class="product-card">
            <div class="product-img">${p.icon}</div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <div class="product-title">${p.name}</div>
                <div class="product-price">₹${p.price.toLocaleString('en-IN')}</div>
                <button class="add-btn"
                    data-id="${p.id}"
                    data-name="${p.name.replace(/'/g, "\\'")}"
                    data-price="${p.price}"
                    data-icon="${p.icon}">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart({
                id: parseInt(btn.dataset.id),
                name: btn.dataset.name,
                price: parseInt(btn.dataset.price),
                icon: btn.dataset.icon
            });
        });
    });

    document.getElementById("loadMoreWrap").style.display =
        displayLimit >= filtered.length ? "none" : "block";
}

function populateCategoryBtns() {
    const unique = [...new Set(masterList.map(p => p.category))];

    let html = `<button class="cat-btn active" data-cat="all">✨ All</button>`;

    unique.forEach(cat => {
        html += `<button class="cat-btn" data-cat="${cat}">${cat}</button>`;
    });

    document.getElementById("categoryFilters").innerHTML = html;

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            activeCat = btn.dataset.cat;
            displayLimit = 12;
            renderProducts();
        });
    });
}

function addToCart(product) {
    const exist = cart.find(i => i.id === product.id);

    if (exist) {
        exist.qty++;
    } else {
        cart.push({
            ...product,
            qty: 1
        });
    }

    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartUI();
    showToast(`✅ ${product.name} added!`);
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cartCount").innerText = totalItems;

    const cartDiv = document.getElementById("cartItemsList");

    if (cart.length === 0) {
        cartDiv.innerHTML = `<div style="text-align:center; padding:30px;">🛒 Cart is empty</div>`;
        document.getElementById("cartTotalPrice").innerHTML = "Total: ₹0";
        return;
    }

    cartDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img">${item.icon}</div>
            <div style="flex:1">
                <div><strong>${item.name}</strong></div>
                <div>₹${item.price.toLocaleString('en-IN')}</div>
                <div class="cart-qty-control">
                    <button class="minus-qty" data-id="${item.id}">−</button>
                    <span>${item.qty}</span>
                    <button class="plus-qty" data-id="${item.id}">+</button>
                    <button class="remove-item" data-id="${item.id}" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById("cartTotalPrice").innerHTML = `Total: ₹${total.toLocaleString('en-IN')}`;

    document.querySelectorAll('.minus-qty').forEach(btn => {
        btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), -1));
    });

    document.querySelectorAll('.plus-qty').forEach(btn => {
        btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), 1));
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => removeCartItem(parseInt(btn.dataset.id)));
    });
}

function changeQty(id, delta) {
    const idx = cart.findIndex(item => item.id === id);

    if (idx !== -1) {
        cart[idx].qty += delta;

        if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
        }

        localStorage.setItem('cartItems', JSON.stringify(cart));
        updateCartUI();
    }
}

function removeCartItem(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartUI();
    showToast("Removed from cart");
}

function showToast(msg) {
    const toast = document.getElementById("toastMsg");
    toast.innerText = msg;
    toast.style.opacity = "1";

    setTimeout(() => {
        toast.style.opacity = "0";
    }, 1800);
}

// Checkout
document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Cart is empty!");
        return;
    }

    localStorage.setItem('cartItems', JSON.stringify(cart));
    window.location.href = 'checkout.html';
});

// Search
document.getElementById("searchBtn").addEventListener("click", () => {
    searchText = document.getElementById("searchInput").value;
    displayLimit = 12;
    renderProducts();
});

document.getElementById("searchInput").addEventListener("keyup", e => {
    if (e.key === "Enter") {
        searchText = e.target.value;
        displayLimit = 12;
        renderProducts();
    }
});

// Load more
document.getElementById("loadMoreBtn").addEventListener("click", () => {
    displayLimit += 12;
    renderProducts();
});

// Cart UI
document.getElementById("cartIcon").addEventListener("click", () => {
    document.getElementById("cartOverlay").classList.add("active");
    document.getElementById("cartSidebar").classList.add("active");
});

document.getElementById("closeCart").addEventListener("click", () => {
    document.getElementById("cartOverlay").classList.remove("active");
    document.getElementById("cartSidebar").classList.remove("active");
});

document.getElementById("cartOverlay").addEventListener("click", () => {
    document.getElementById("cartOverlay").classList.remove("active");
    document.getElementById("cartSidebar").classList.remove("active");
});

// User dropdown
document.getElementById("userBtn").addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("userDropdown").classList.toggle("show");
});

document.addEventListener("click", () => {
    document.getElementById("userDropdown").classList.remove("show");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
});

populateCategoryBtns();
renderProducts();
updateCartUI();