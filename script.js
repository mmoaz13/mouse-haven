let globalProducts = [];
let currentCategory = 'all';

const PROMO_CODES = {
  'WELCOME10': { type: 'percentage', value: 10 },
  'SAVE20': { type: 'percentage', value: 20 },
  'FLAT50': { type: 'fixed', value: 50 }
};

function applyPromoCode(code) {
  const promoCode = PROMO_CODES[code.toUpperCase()];
  if (!promoCode) {
    showToast('Invalid promo code', 'error');
    return false;
  }

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    showToast('Cart is empty', 'error');
    return false;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;

  if (promoCode.type === 'percentage') {
    discount = (subtotal * promoCode.value) / 100;
  } else if (promoCode.type === 'fixed') {
    discount = Math.min(promoCode.value, subtotal);
  }

  localStorage.setItem('activePromo', JSON.stringify({ code, discount }));
  updateCartTotals();
  showToast('Promo code applied successfully!');
  
  const promoMessage = document.getElementById('promo-message');
  promoMessage.textContent = `Promo code applied: -$${discount.toFixed(2)}`;
  promoMessage.classList.remove('hidden');
  
  return true;
}

async function loadProducts() {
  try {
    const response = await fetch('https://mmoaz13.github.io/mouse-haven/data.json');
    if (!response.ok) throw new Error('Failed to load products');
    const data = await response.json();
    globalProducts = data.products;
    return data.products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

function addToCart(productId) {
  const product = globalProducts.find(p => p.id === productId);
  if (!product) return;

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  showToast('Added to cart!');
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const badge = document.getElementById('cart-badge');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = type === 'success' 
    ? 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transform translate-y-20 opacity-0 transition-all duration-300 flex items-center bg-vibrant-500'
    : 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transform translate-y-20 opacity-0 transition-all duration-300 flex items-center bg-hot-600';
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle mr-2"></i><span>${message}</span>`;
  
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function filterProducts(category) {
  currentCategory = category;
  const filteredProducts = category === 'all' 
    ? globalProducts 
    : globalProducts.filter(product => product.category === category);
  
  renderProducts(filteredProducts);
  
  document.querySelectorAll('.category-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
}

function renderProducts(products) {
  const productsGrid = document.getElementById('products-grid');
  
  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-300">No products found</h3>
        <p class="text-gray-400 mt-2">Try selecting a different category</p>
      </div>
    `;
    return;
  }
  
  productsGrid.innerHTML = products.map(product => `
    <div class="card product-card">
      <figure class="relative overflow-hidden">
        <div class="category-badge absolute top-3 left-3">
          ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}
        </div>
        <img src="${product.image}" alt="${product.name}" class="w-full h-56 object-cover" />
        <div class="absolute top-3 right-3 text-sm text-white/80 bg-black/30 px-3 py-1 rounded backdrop-blur-sm">
          ${product.specs.connectivity}
        </div>
      </figure>
      <div class="card-body">
        <h2 class="card-title">${product.name}</h2>
        <p class="price">$${product.price.toFixed(2)}</p>
        <p class="description">${product.description}</p>
        
        <div class="spec-list">
          <div class="spec-item">
            <span class="spec-label">DPI</span>
            <span class="spec-value">${product.specs.dpi}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Weight</span>
            <span class="spec-value">${product.specs.weight}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Battery</span>
            <span class="spec-value">${product.specs.battery}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Switches</span>
            <span class="spec-value">${product.specs.switches}</span>
          </div>
        </div>
        
        <div class="features">
          ${product.specs.features}
        </div>
        
        <div class="card-actions justify-end mt-4">
          <button onclick="addToCart(${product.id})" class="btn btn-vibrant w-full">
            <i class="fas fa-shopping-cart mr-2"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function initializeCart() {
  const cartButton = document.getElementById('cart-button');
  const closeCartButton = document.getElementById('close-cart');
  const cartDrawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('overlay');
  const applyPromoButton = document.getElementById('apply-promo');
  const promoInput = document.getElementById('promo-code-input');

  cartButton.addEventListener('click', () => {
    cartDrawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateCartItems();
  });

  function closeCart() {
    cartDrawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeCartButton.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);

  applyPromoButton.addEventListener('click', () => {
    const code = promoInput.value.trim();
    if (code) {
      if (applyPromoCode(code)) {
        promoInput.value = '';
      }
    } else {
      showToast('Please enter a promo code', 'error');
    }
  });

  document.getElementById('clear-cart').addEventListener('click', () => {
    localStorage.removeItem('cart');
    localStorage.removeItem('activePromo');
    
    const badge = document.getElementById('cart-badge');
    badge.textContent = '0';
    badge.classList.add('hidden');
    
    const promoMessage = document.getElementById('promo-message');
    promoMessage.classList.add('hidden');
    
    updateCartItems();
    updateCartTotals();
    
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart text-4xl mb-4 text-gray-400"></i>
        <p>Your cart is empty</p>
        <p class="text-sm text-gray-500 mt-2">Browse our products and add items to your cart</p>
      </div>
    `;

    document.getElementById('cart-subtotal').textContent = '$0.00';
    document.getElementById('cart-shipping').textContent = '$0.00';
    document.getElementById('cart-total').textContent = '$0.00';
    
    const discountRow = document.getElementById('discount-row');
    if (discountRow) {
      discountRow.style.display = 'none';
    }

    showToast('Cart cleared');
  });
}

function updateCartItems() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart text-4xl mb-4 text-gray-400"></i>
        <p>Your cart is empty</p>
        <p class="text-sm text-gray-500 mt-2">Browse our products and add items to your cart</p>
      </div>
    `;
    
    document.getElementById('cart-subtotal').textContent = '$0.00';
    document.getElementById('cart-shipping').textContent = '$0.00';
    document.getElementById('cart-total').textContent = '$0.00';
    
    const discountRow = document.getElementById('discount-row');
    if (discountRow) {
      discountRow.style.display = 'none';
    }
    
    return;
  }
  
  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded">
      <div>
        <h3 class="font-semibold">${item.name}</h3>
        <p class="text-vibrant-400 font-medium">$${item.price.toFixed(2)}</p>
        <div class="quantity-control">
          <button onclick="updateQuantity(${item.id}, -1)" class="decrease-quantity">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${item.id}, 1)" class="increase-quantity">+</button>
        </div>
      </div>
      <button onclick="removeFromCart(${item.id})" class="remove-item text-gray-400 hover:text-hot-500">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');

  updateCartTotals();
}

function updateCartTotals() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 5.99 : 0;
  let discount = 0;
  
  const activePromo = JSON.parse(localStorage.getItem('activePromo'));
  if (activePromo) {
    discount = activePromo.discount;
  }

  const total = subtotal + shipping - discount;

  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cart-shipping').textContent = `$${shipping.toFixed(2)}`;
  
  const discountRow = document.getElementById('discount-row');
  const cartDiscount = document.getElementById('cart-discount');
  if (discountRow && cartDiscount) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      cartDiscount.textContent = `-$${discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

window.updateQuantity = function(productId, change) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const itemIndex = cart.findIndex(item => item.id === productId);

  if (itemIndex !== -1) {
    cart[itemIndex].quantity += change;
    
    if (cart[itemIndex].quantity <= 0) {
      cart = cart.filter(item => item.id !== productId);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    updateCartItems();
  }
};

window.removeFromCart = function(productId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  updateCartItems();
  showToast('Item removed from cart');
};

function initializeCheckout() {
  const proceedToCheckout = document.getElementById('proceed-to-checkout');
  const backToCart = document.getElementById('back-to-cart');
  const continueToReview = document.getElementById('continue-to-review');
  const backToShipping = document.getElementById('back-to-shipping');
  const checkoutButton = document.getElementById('checkout-button');
  const continueShopping = document.getElementById('continue-shopping');
  const cartView = document.getElementById('cart-view');
  const shippingView = document.getElementById('shipping-view');
  const reviewView = document.getElementById('review-view');
  const purchaseModal = document.getElementById('purchase-modal');

  proceedToCheckout.addEventListener('click', () => {
    cartView.classList.remove('active');
    shippingView.classList.add('active');
    updateReviewItems();
  });

  backToCart.addEventListener('click', () => {
    shippingView.classList.remove('active');
    cartView.classList.add('active');
  });

  continueToReview.addEventListener('click', () => {
    shippingView.classList.remove('active');
    reviewView.classList.add('active');
    updateReviewItems();
  });

  backToShipping.addEventListener('click', () => {
    reviewView.classList.remove('active');
    shippingView.classList.add('active');
  });

  checkoutButton.addEventListener('click', () => {
    const emailInput = document.getElementById('checkout-email');
    const emailError = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(emailInput.value.trim())) {
      emailError.classList.remove('hidden');
      emailInput.classList.add('border-hot-500');
      return;
    }

    document.getElementById('confirmation-email').textContent = emailInput.value;
    
    const total = document.getElementById('review-total').textContent;
    document.getElementById('purchase-total').textContent = total;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderSummary = document.getElementById('order-summary');
    orderSummary.innerHTML = cart.map(item => `
      <div class="flex justify-between items-center mb-2">
        <span>${item.name} x${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');
    
    purchaseModal.classList.add('open');
    
    localStorage.removeItem('cart');
    const badge = document.getElementById('cart-badge');
    badge.textContent = '0';
    badge.classList.add('hidden');
    updateCartItems();
  });

  continueShopping.addEventListener('click', () => {
    purchaseModal.classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
    document.body.style.overflow = '';
    
    reviewView.classList.remove('active');
    cartView.classList.add('active');
    
    document.getElementById('checkout-email').value = '';
    
    updateCartItems();
  });
}

function updateReviewItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const reviewItemsContainer = document.getElementById('review-items');
  
  reviewItemsContainer.innerHTML = cart.map(item => `
    <div class="flex items-center justify-between mb-4 bg-[#1e1e3a] p-4 rounded-lg">
      <div class="flex items-center">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-4">
        <div>
          <h4 class="font-semibold">${item.name}</h4>
          <p class="text-sm text-gray-400">Quantity: ${item.quantity}</p>
        </div>
      </div>
      <p class="font-medium">$${(item.price * item.quantity).toFixed(2)}</p>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = document.querySelector('.shipping-option.selected').dataset.shipping;
  const shippingCost = parseFloat(shipping);
  const total = subtotal + shippingCost;

  document.getElementById('review-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('review-shipping').textContent = `$${shippingCost.toFixed(2)}`;
  document.getElementById('review-total').textContent = `$${total.toFixed(2)}`;
}

function initializeShippingOptions() {
  const shippingOptions = document.querySelectorAll('.shipping-option');
  
  shippingOptions.forEach(option => {
    option.addEventListener('click', () => {
      shippingOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      
      option.querySelector('input[type="radio"]').checked = true;
      
      updateReviewItems();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const products = await loadProducts();
  if (products.length > 0) {
    renderProducts(products);
  }

  updateCartBadge();

  document.querySelectorAll('.category-filter').forEach(button => {
    button.addEventListener('click', () => {
      filterProducts(button.dataset.category);
    });
  });

  initializeCart();

  document.getElementById('checkout-email').addEventListener('input', function() {
    const emailError = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(this.value.trim())) {
      emailError.classList.add('hidden');
      this.classList.remove('border-hot-500');
    }
  });

  initializeCheckout();
  
  initializeShippingOptions();
}); 

document.getElementById('newsletter-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput.value;
      
      if (email) {
        const newsletterToast = document.getElementById('newsletter-toast');
        newsletterToast.style.transform = 'translateY(0)';
        newsletterToast.style.opacity = '1';
        
        emailInput.value = '';
        
        setTimeout(() => {
          newsletterToast.style.transform = 'translateY(20px)';
          newsletterToast.style.opacity = '0';
        }, 3000);
      }
    });