import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🔧 Vite config com hostname customizado
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',            // Torna acessível na rede
    port: 9282,                 // Porta desejada
    strictPort: true,           // Erro se porta estiver em uso
    allowedHosts: ['transferplus.snm.local'], // 🧠 Domínio custom na rede
    cors: true
  }
})
