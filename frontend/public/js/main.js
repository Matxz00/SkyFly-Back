// ===============================
// CONFIGURACIÓN BASE
// ===============================
const API_BASE_URL = 'http://localhost:3000/api/users'; // URL base backend

// ===============================
// HELPERS
// ===============================
function showMessage(elementId, message, type = 'success') {
  const messageDiv = document.getElementById(elementId);
  if (messageDiv) {
    messageDiv.textContent = message;
    if (type === 'success') {
      messageDiv.className = 'mt-4 text-center text-sm text-green-500 font-medium';
    } else if (type === 'error') {
      messageDiv.className = 'mt-4 text-center text-sm text-red-500 font-medium';
    } else if (type === 'info') {
      messageDiv.className = 'mt-4 text-center text-sm text-blue-500 font-medium';
    }
    messageDiv.classList.remove('hidden');
  }
}

function isLoggedIn() {
  return localStorage.getItem('jwtToken') !== null;
}
function getAuthHeaders() {
  const token = localStorage.getItem('jwtToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
function saveToken(token) {
  localStorage.setItem('jwtToken', token);
}
function removeToken() {
  localStorage.removeItem('jwtToken');
}

async function fetchProfile() {
  if (!isLoggedIn()) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (response.ok) return await response.json();
    if (response.status === 401) {
      removeToken();
      window.location.href = 'login.html';
    }
    return null;
  } catch (err) {
    console.error("Error obteniendo perfil:", err);
    return null;
  }
}

// ===============================
// NAVBAR & UI GLOBAL
// ===============================
const loginNavLink = document.getElementById('loginNavLink');
const registerNavLink = document.getElementById('registerNavLink');
const profileNavLink = document.getElementById('profileNavLink');
const logoutButton = document.getElementById('logoutButton');
const loggedInUsernameSpan = document.getElementById('loggedInUsername');
const authPromptDiv = document.getElementById('authPrompt');
const welcomeMessageDiv = document.getElementById('welcomeMessage');
const profileLinkContainer = document.getElementById('profileLinkContainer');
const mainContent = document.getElementById('mainContent');
const cartButton = document.getElementById("cartButton");

async function updateUIVisibility() {
  if (isLoggedIn()) {
    if (loginNavLink) loginNavLink.classList.add('hidden');
    if (registerNavLink) registerNavLink.classList.add('hidden');
    if (profileNavLink) profileNavLink.classList.remove('hidden');
    if (logoutButton) logoutButton.classList.remove('hidden');
    if (cartButton) cartButton.classList.remove('hidden');

    const profile = await fetchProfile();
    if (profile && loggedInUsernameSpan) {
      loggedInUsernameSpan.textContent = profile.username;
      if (authPromptDiv) authPromptDiv.classList.add('hidden');
      if (welcomeMessageDiv) welcomeMessageDiv.classList.remove('hidden');
      if (profileLinkContainer) profileLinkContainer.classList.remove('hidden');
      if (mainContent) mainContent.classList.remove('hidden');
    } else {
      removeToken();
      if (loginNavLink) loginNavLink.classList.remove('hidden');
      if (registerNavLink) registerNavLink.classList.remove('hidden');
      if (profileNavLink) profileNavLink.classList.add('hidden');
      if (logoutButton) logoutButton.classList.add('hidden');
      if (cartButton) cartButton.classList.add('hidden');
      if (authPromptDiv) authPromptDiv.classList.remove('hidden');
      if (welcomeMessageDiv) welcomeMessageDiv.classList.add('hidden');
      if (profileLinkContainer) profileLinkContainer.classList.add('hidden');
      if (mainContent) mainContent.classList.add('hidden');
    }
  } else {
    if (loginNavLink) loginNavLink.classList.remove('hidden');
    if (registerNavLink) registerNavLink.classList.remove('hidden');
    if (profileNavLink) profileNavLink.classList.add('hidden');
    if (logoutButton) logoutButton.classList.add('hidden');
    if (cartButton) cartButton.classList.add('hidden');
    if (authPromptDiv) authPromptDiv.classList.remove('hidden');
    if (welcomeMessageDiv) welcomeMessageDiv.classList.add('hidden');
    if (profileLinkContainer) profileLinkContainer.classList.add('hidden');
    if (mainContent) mainContent.classList.add('hidden');
  }
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    removeToken();
    window.location.href = 'index.html';
  });
}
updateUIVisibility();

// ===============================
// FORMULARIOS
// ===============================
// Registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('message', data.message || '¡Registro exitoso!', 'success');
        registerForm.reset();
        setTimeout(() => window.location.href = 'login.html', 2000);
      } else showMessage('message', data.message || 'Error en registro', 'error');
    } catch {
      showMessage('message', 'Error de conexión', 'error');
    }
  });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresTwoFactor) {
          sessionStorage.setItem('tempUserIdFor2FA', data.userId);
          showMessage('message', data.message, 'info');
          setTimeout(() => window.location.href = '2fa-verification.html', 1000);
        } else {
          saveToken(data.token);
          showMessage('message', data.message || 'Login exitoso', 'success');
          loginForm.reset();
          setTimeout(() => window.location.href = 'index.html', 1000);
        }
      } else showMessage('message', data.message || 'Error login', 'error');
    } catch {
      showMessage('message', 'Error de conexión', 'error');
    }
  });
}

// Forgot Password (pedir correo)
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('forgotMessage', data.message || 'Enlace enviado a tu correo', 'success');
        forgotPasswordForm.reset();
      } else {
        showMessage('forgotMessage', data.message || 'Error al enviar enlace', 'error');
      }
    } catch {
      showMessage('forgotMessage', 'Error de conexión', 'error');
    }
  });
}

// Reset Password (con token)
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (newPassword !== confirmPassword) {
      showMessage('message', 'Las contraseñas no coinciden.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('message', 'Contraseña actualizada', 'success');
        resetPasswordForm.reset();
        setTimeout(() => window.location.href = 'login.html', 3000);
      } else showMessage('message', data.message || 'Error', 'error');
    } catch {
      showMessage('message', 'Error de conexión', 'error');
    }
  });
}

// ===============================
// PERFIL & 2FA
// ===============================
const profileIdSpan = document.getElementById('profileId');
const profileUsernameSpan = document.getElementById('profileUsername');
const profileEmailSpan = document.getElementById('profileEmail');
const profileTwoFactorEnabledSpan = document.getElementById('profileTwoFactorEnabled');
async function loadProfileData() {
  if (profileIdSpan && isLoggedIn()) {
    const profile = await fetchProfile();
    if (profile) {
      profileIdSpan.textContent = profile.id;
      profileUsernameSpan.textContent = profile.username;
      profileEmailSpan.textContent = profile.email;
      profileTwoFactorEnabledSpan.textContent = profile.twoFactorEnabled ? 'Sí' : 'No';
    }
  }
}
if (window.location.pathname.includes('profile.html')) loadProfileData();

// ===============================
// PRODUCTOS & CARRITO
// ===============================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Elementos del carrito
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const clearCart = document.getElementById("clearCart");
const checkout = document.getElementById("checkout");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

// Productos de ejemplo
const productos = [
  { id: 1, nombre: "BMX Freestyle", precio: 150, imagen: "img/bmx.jpg", descripcion: "Ideal para trucos y saltos" },
  { id: 2, nombre: "Cascos SkyFly", precio: 50, imagen: "img/casco.jpg", descripcion: "Protección segura y ligera" },
  { id: 3, nombre: "Guantes ProGrip", precio: 25, imagen: "img/guantes.jpg", descripcion: "Comodidad y control extremo" }
];

// Guardar carrito en localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Actualizar UI del carrito
function updateCartUI() {
  if (!cartItems || !cartTotal || !cartCount) return;

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    total += item.precio;
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-gray-800 p-2 rounded";
    li.innerHTML = `
      <span>${item.nombre} - $${item.precio}</span>
      <button class="text-red-400 hover:text-red-600">🗑️</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      cart.splice(i, 1);
      updateCartUI();
    });
    cartItems.appendChild(li);
  });

  cartTotal.textContent = `$${total}`;
  cartCount.textContent = cart.length;

  saveCart();
}

// Agregar al carrito
function addToCart(p) {
  cart.push(p);
  updateCartUI();
}

// Vaciar carrito
function clearCartItems() {
  cart = [];
  updateCartUI();
}

// ===============================
// EVENTOS CARRITO
// ===============================
if (cartButton) {
  cartButton.addEventListener("click", () => cartModal?.classList.remove("hidden"));
}
if (closeCart) {
  closeCart.addEventListener("click", () => cartModal?.classList.add("hidden"));
}
if (clearCart) {
  clearCart.addEventListener("click", clearCartItems);
}
if (checkout) {
  checkout.addEventListener("click", () => {
    alert("¡Gracias por tu compra!");
    clearCartItems();
    cartModal?.classList.add("hidden");
  });
}

// Inicializar carrito
updateCartUI();

// Render dinámico de productos
const grid = document.querySelector("#mainContent .grid");
if (grid) {
  productos.forEach(prod => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 p-6 rounded-xl shadow-lg text-center";
    card.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}" class="w-full h-48 object-cover rounded-lg mb-4">
      <h3 class="text-xl font-bold text-purple-300">${prod.nombre}</h3>
      <p class="text-gray-400 text-sm mt-2">${prod.descripcion}</p>
      <p class="text-green-400 text-lg font-bold mt-2">$${prod.precio}</p>
      <button class="btn-neon-purple mt-4">Agregar al carrito</button>
    `;
    card.querySelector("button").addEventListener("click", () => addToCart(prod));
    grid.appendChild(card);
  });
}
