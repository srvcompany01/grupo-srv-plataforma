import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  // 'server-only' só protege o bundle do Next; nos testes (Node puro) vira um módulo vazio.
  resolve: { alias: { '@': path.resolve(__dirname, 'src'), 'server-only': path.resolve(__dirname, 'tests/vazio.ts') } },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 60000, hookTimeout: 60000 },
})
