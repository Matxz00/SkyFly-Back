// tailwind.config.js
module.exports = {
  // Asegúrate de que Tailwind escanee todos los archivos HTML y JS para encontrar clases
  content: [
    "./public/**/*.html", // Escanea todos los archivos HTML en la carpeta public y subcarpetas
    "./public/js/**/*.js",   // Escanea tus archivos JavaScript si generas clases dinámicamente
  ],
  theme: {
    extend: {
      // Definir tus fuentes personalizadas
      fontFamily: {
        // 'sans' es la fuente predeterminada de Tailwind, la estamos extendiendo
        // para que 'Bebas Neue' sea la primera opción si se usa 'font-sans'
        sans: ['"Bebas Neue"', 'sans-serif'], 
        // 'orbitron' es una nueva utilidad que puedes usar como 'font-orbitron'
        orbitron: ['"Orbitron"', 'sans-serif'], 
      },
      // Definir tus keyframes de CSS para animaciones
      keyframes: {
        slideDown: {
          'from': { transform: 'translateY(-100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInDown: {
          'from': { opacity: '0', transform: 'translateY(-20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        pulseBg: {
          '0%': { opacity: '0.7' },
          '50%': { opacity: '0.6' },
          '100%': { opacity: '0.7' },
        },
        neonGlow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 0, 255, 0.5), 0 0 10px rgba(255, 0, 255, 0.3)' },
          '50%': { boxShadow: '0 0 10px rgba(255, 0, 255, 0.7), 0 0 20px rgba(255, 0, 255, 0.5)' },
          '100%': { boxShadow: '0 0 5px rgba(255, 0, 255, 0.5), 0 0 10px rgba(255, 0, 255, 0.3)' },
        },
      },
      // Asociar tus keyframes a nombres de utilidades de animación
      animation: {
        'slide-down': 'slideDown 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.7s ease-out forwards',
        // Animaciones con retraso
        'fade-in-down-delay': 'fadeInDown 1s ease-out forwards 0.2s',
        'fade-in-up-delay': 'fadeInUp 1s ease-out forwards 0.4s',
        'scale-in-delay': 'scaleIn 0.8s ease-out forwards 0.6s',
        'pulse-bg': 'pulseBg 3s infinite alternate',
        'card-glow': 'neonGlow 1.5s infinite alternate',
      }
    },
  },
  plugins: [],
}