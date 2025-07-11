// frontend/public/js/main.js

const API_BASE_URL = 'http://localhost:3000/api/users'; // URL base de tu backend

// --- Helper Functions ---

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
    if (!isLoggedIn()) {
        console.warn('No hay token JWT, no se puede obtener el perfil.');
        return null;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 401) {
            console.log('Token expirado o inválido, redirigiendo al login.');
            removeToken();
            window.location.href = 'login.html';
        } else {
            console.error('Error al obtener perfil:', await response.json());
            return null;
        }
    } catch (error) {
        console.error('Error de conexión al obtener perfil:', error);
        return null;
    }
}


// --- Navbar & Global UI Logic ---

const loginNavLink = document.getElementById('loginNavLink');
const registerNavLink = document.getElementById('registerNavLink');
const profileNavLink = document.getElementById('profileNavLink');
const logoutButton = document.getElementById('logoutButton');
const loggedInUsernameSpan = document.getElementById('loggedInUsername');
const authPromptDiv = document.getElementById('authPrompt');
const welcomeMessageDiv = document.getElementById('welcomeMessage');
const profileLinkContainer = document.getElementById('profileLinkContainer');
const mainContent = document.getElementById('mainContent');

async function updateUIVisibility() {
    if (isLoggedIn()) {
        if (loginNavLink) loginNavLink.classList.add('hidden');
        if (registerNavLink) registerNavLink.classList.add('hidden');
        if (profileNavLink) profileNavLink.classList.remove('hidden');
        if (logoutButton) logoutButton.classList.remove('hidden');

        // Fetch user data for personalized greeting
        const profile = await fetchProfile();
        if (profile && loggedInUsernameSpan) {
            loggedInUsernameSpan.textContent = profile.username;
            if (authPromptDiv) authPromptDiv.classList.add('hidden');
            if (welcomeMessageDiv) welcomeMessageDiv.classList.remove('hidden');
            if (profileLinkContainer) profileLinkContainer.classList.remove('hidden');
            if (mainContent) mainContent.classList.remove('hidden'); // Show content for logged-in users
        } else {
             // If profile fetch fails, treat as not logged in or token invalid
             removeToken();
             if (loginNavLink) loginNavLink.classList.remove('hidden');
             if (registerNavLink) registerNavLink.classList.remove('hidden');
             if (profileNavLink) profileNavLink.classList.add('hidden');
             if (logoutButton) logoutButton.classList.add('hidden');
             if (authPromptDiv) authPromptDiv.classList.remove('hidden');
             if (welcomeMessageDiv) welcomeMessageDiv.classList.add('hidden');
             if (profileLinkContainer) profileLinkContainer.classList.add('hidden');
             if (mainContent) mainContent.classList.add('hidden'); // Hide content
        }

    } else {
        if (loginNavLink) loginNavLink.classList.remove('hidden');
        if (registerNavLink) registerNavLink.classList.remove('hidden');
        if (profileNavLink) profileNavLink.classList.add('hidden');
        if (logoutButton) logoutButton.classList.add('hidden'); // Hide logout button if not logged in
        if (authPromptDiv) authPromptDiv.classList.remove('hidden');
        if (welcomeMessageDiv) welcomeMessageDiv.classList.add('hidden');
        if (profileLinkContainer) profileLinkContainer.classList.add('hidden');
        if (mainContent) mainContent.classList.add('hidden'); // Hide content
    }
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        removeToken();
        window.location.href = 'index.html'; // Redirige a la página de inicio
    });
}

// Initial UI update on page load
updateUIVisibility();


// --- Form Handlers ---

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('message');

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                showMessage('message', data.message || '¡Registro exitoso! Redirigiendo al login...', 'success');
                registerForm.reset();
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } else {
                showMessage('message', data.message || 'Error en el registro.', 'error');
            }
        } catch (error) {
            console.error('Error durante el registro:', error);
            showMessage('message', 'Error de conexión o del servidor.', 'error');
        }
    });
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('message');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                if (data.requiresTwoFactor) {
                    // Si el backend indica 2FA, almacenamos el ID del usuario y redirigimos
                    sessionStorage.setItem('tempUserIdFor2FA', data.userId);
                    showMessage('message', data.message, 'info');
                    setTimeout(() => { window.location.href = '2fa-verification.html'; }, 1000);
                } else {
                    // Si no hay 2FA, guardamos el token y redirigimos directamente
                    saveToken(data.token);
                    showMessage('message', data.message || 'Inicio de sesión exitoso. Redirigiendo...', 'success');
                    loginForm.reset();
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                }
            } else {
                showMessage('message', data.message || 'Error en el inicio de sesión.', 'error');
            }
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            showMessage('message', 'Error de conexión o del servidor.', 'error');
        }
    });
}

// Forgot Password Form
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const messageDiv = document.getElementById('message');

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (response.ok) {
                showMessage('message', data.message, 'success');
                forgotPasswordForm.reset();
            } else {
                showMessage('message', data.message || 'Error al solicitar restablecimiento.', 'error');
            }
        } catch (error) {
            console.error('Error durante la solicitud de restablecimiento:', error);
            showMessage('message', 'Error de conexión o del servidor.', 'error');
        }
    });
}

// Reset Password Form (from email link)
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('message', 'Token de restablecimiento no encontrado en la URL.', 'error');
    }

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('message');

        if (newPassword !== confirmPassword) {
            showMessage('message', 'Las contraseñas no coinciden.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await response.json();

            if (response.ok) {
                showMessage('message', data.message || 'Contraseña actualizada. Redirigiendo al login...', 'success');
                resetPasswordForm.reset();
                setTimeout(() => { window.location.href = 'login.html'; }, 3000);
            } else {
                showMessage('message', data.message || 'Error al restablecer la contraseña.', 'error');
            }
        } catch (error) {
            console.error('Error durante el restablecimiento de contraseña:', error);
            showMessage('message', 'Error de conexión o del servidor.', 'error');
        }
    });
}


// Profile Page Logic
const profileIdSpan = document.getElementById('profileId');
const profileUsernameSpan = document.getElementById('profileUsername');
const profileEmailSpan = document.getElementById('profileEmail');
const profileTwoFactorEnabledSpan = document.getElementById('profileTwoFactorEnabled');
const twoFactorSection = document.getElementById('twoFactorSection');
const twoFaStatusDiv = document.getElementById('2faStatus');
const twoFaSetupDiv = document.getElementById('2faSetup');
const twoFaDisableDiv = document.getElementById('2faDisable');
const setup2faButton = document.getElementById('setup2faButton');
const disable2faButton = document.getElementById('disable2faButton');
const twoFaMessageDiv = document.getElementById('2faMessage');


async function loadProfileData() {
    if (profileIdSpan && isLoggedIn()) { // Only execute if on profile page and logged in
        const profile = await fetchProfile();
        if (profile) {
            profileIdSpan.textContent = profile.id;
            profileUsernameSpan.textContent = profile.username;
            profileEmailSpan.textContent = profile.email;
            profileTwoFactorEnabledSpan.textContent = profile.twoFactorEnabled ? 'Sí' : 'No';

            // 2FA UI logic
            if (twoFactorSection) {
                if (profile.twoFactorEnabled) {
                    twoFaStatusDiv.textContent = 'Estado: Habilitado';
                    twoFaStatusDiv.className = 'mb-4 text-lg font-semibold text-green-400';
                    twoFaSetupDiv.classList.add('hidden');
                    twoFaDisableDiv.classList.remove('hidden');
                } else {
                    twoFaStatusDiv.textContent = 'Estado: Deshabilitado';
                    twoFaStatusDiv.className = 'mb-4 text-lg font-semibold text-red-400';
                    twoFaSetupDiv.classList.remove('hidden');
                    twoFaDisableDiv.classList.add('hidden');
                }
            }
        } else {
            showMessage('twoFaMessage', 'No se pudo cargar la información del perfil.', 'error');
        }
    }
}

// Habilitar 2FA
if (setup2faButton) {
    setup2faButton.addEventListener('click', async () => {
        try {
            showMessage('twoFaMessage', 'Habilitando 2FA...', 'info');
            const response = await fetch(`${API_BASE_URL}/2fa/enable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });
            const data = await response.json();

            if (response.ok) {
                showMessage('twoFaMessage', data.message || '2FA habilitado exitosamente!', 'success');
                loadProfileData(); // Recarga para actualizar UI
            } else {
                showMessage('twoFaMessage', data.message || 'Error al habilitar 2FA.', 'error');
            }
        } catch (error) {
            console.error('Error durante la habilitación de 2FA:', error);
            showMessage('twoFaMessage', 'Error de conexión o del servidor al habilitar 2FA.', 'error');
        }
    });
}


// Deshabilitar 2FA
if (disable2faButton) {
    disable2faButton.addEventListener('click', async () => {
        try {
            showMessage('twoFaMessage', 'Deshabilitando 2FA...', 'info');
            const response = await fetch(`${API_BASE_URL}/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });
            const data = await response.json();

            if (response.ok) {
                showMessage('twoFaMessage', data.message || '2FA deshabilitado exitosamente.', 'success');
                loadProfileData(); // Recarga para actualizar UI
            } else {
                showMessage('twoFaMessage', data.message || 'Error al deshabilitar 2FA.', 'error');
            }
        } catch (error) {
            console.error('Error durante la deshabilitación de 2FA:', error);
            showMessage('twoFaMessage', 'Error de conexión o del servidor al deshabilitar 2FA.', 'error');
        }
    });
}


// 2FA Verification Page Logic (for login flow via email)
const twoFactorVerificationForm = document.getElementById('twoFactorVerificationForm');
if (twoFactorVerificationForm) {
    twoFactorVerificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codeInput = document.getElementById('2faTokenInput').value;
        const messageDiv = document.getElementById('message');
        const userId = sessionStorage.getItem('tempUserIdFor2FA'); // Obtiene el ID del usuario

        if (!userId) {
            showMessage('message', 'No se encontró el ID de usuario para 2FA. Por favor, intente iniciar sesión de nuevo.', 'error');
            return;
        }
        if (!codeInput) {
            showMessage('message', 'Por favor, introduce el código de verificación.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/2fa/verify-email`, { // <-- ¡Nueva ruta!
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, code: codeInput }), // Enviamos userId y code
            });
            const data = await response.json();

            if (response.ok) {
                saveToken(data.token); // Guarda el token JWT final
                sessionStorage.removeItem('tempUserIdFor2FA'); // Limpia el ID temporal
                showMessage('message', data.message || 'Verificación 2FA exitosa. Accediendo...', 'success');
                twoFactorVerificationForm.reset();
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            } else {
                showMessage('message', data.message || 'Código de verificación 2FA inválido.', 'error');
            }
        } catch (error) {
            console.error('Error durante la verificación 2FA para inicio de sesión:', error);
            showMessage('message', 'Error de conexión o del servidor.', 'error');
        }
    });
}


// Load profile data when profile.html is loaded
if (window.location.pathname.includes('profile.html')) {
    loadProfileData();
}

// Initial check for authentication status on index.html
if (window.location.pathname.includes('index.html')) {
    updateUIVisibility();
}