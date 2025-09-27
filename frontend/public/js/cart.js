// =========================
// cart.js (para cart.html)
// =========================

// Intentamos cargar el carrito desde localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Si no hay nada en localStorage, usamos valores por defecto
if (cart.length === 0) {
  cart = [
    {
      id: 1,
      nombre: "BMX Freestyle",
      cantidad: 2,
      precio: 150,
      imagen: "img/bmx.jpg",
      descripcion: "Ideal para trucos y saltos"
    },
    {
      id: 2,
      nombre: "Cascos SkyFly",
      cantidad: 1,
      precio: 50,
      imagen: "img/casco.jpg",
      descripcion: "Protección segura y ligera"
    }
  ];
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Elementos del DOM
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCart");
const checkoutBtn = document.getElementById("checkout");

// =========================
// Renderizar carrito
// =========================
function renderCart() {
  cartItems.innerHTML = "";

  cart.forEach(producto => {
    const li = document.createElement("li");
    li.className = `
      flex items-center justify-between 
      bg-gray-800/60 backdrop-blur-md rounded-2xl p-4 shadow-md 
      border border-gray-700 
      transform transition-transform duration-300 hover:-translate-y-2 hover:scale-105
    `;

    li.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}" class="w-20 h-20 object-cover rounded-lg border-2 border-purple-400 transform transition-transform duration-300 hover:scale-110">
      <div class="flex-1 ml-4">
        <h3 class="text-xl font-bold text-purple-300 drop-shadow-lg">${producto.nombre}</h3>
        <p class="text-gray-300 mt-1">Cantidad: <span class="font-semibold text-green-400">${producto.cantidad}</span></p>
        <p class="text-gray-400 text-sm mt-1">${producto.descripcion}</p>
      </div>
      <div class="flex flex-col items-end space-y-2">
        <span class="text-lg font-bold text-green-400">$${producto.precio * producto.cantidad}</span>
        <button class="px-3 py-1 text-sm font-semibold rounded-lg border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300" onclick="removeItem(${producto.id})">
          Eliminar
        </button>
      </div>
    `;
    
    // Animación de aparición
    li.style.opacity = 0;
    li.style.transform = "translateY(20px)";
    cartItems.appendChild(li);
    setTimeout(() => {
      li.style.transition = "all 0.4s ease-out";
      li.style.opacity = 1;
      li.style.transform = "translateY(0)";
    }, 50);
  });

  // Total
  const total = cart.reduce((sum, producto) => sum + producto.precio * producto.cantidad, 0);
  cartTotal.textContent = `$${total}`;

  // Guardar siempre en localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =========================
// Eliminar producto
// =========================
function removeItem(id) {
  const itemElement = Array.from(cartItems.children).find(
    li => li.querySelector("button").onclick.toString().includes(`removeItem(${id})`)
  );
  
  if (itemElement) {
    // Animación de salida
    itemElement.style.transition = "all 0.4s ease-in";
    itemElement.style.opacity = 0;
    itemElement.style.transform = "translateY(-20px)";
    setTimeout(() => {
      cart = cart.filter(producto => producto.id !== id);
      renderCart();
    }, 400);
  }
}

// =========================
// Vaciar carrito
// =========================
clearCartBtn.addEventListener("click", () => {
  if(cart.length === 0) return;

  // Animación de todos los items
  Array.from(cartItems.children).forEach(li => {
    li.style.transition = "all 0.4s ease-in";
    li.style.opacity = 0;
    li.style.transform = "translateY(-20px)";
  });

  setTimeout(() => {
    cart = [];
    renderCart();
  }, 400);
});

// =========================
// Checkout
// =========================
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Tu carrito está vacío!");
  } else {
    const total = cart.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
    alert("¡Gracias por tu compra! Total: $" + total);
    cart = [];
    renderCart();
  }
});

// Render inicial
renderCart();
