import {defineConfig} from 'vitest/config';

try {process.loadEnvFile();} catch {}

export default defineConfig ({test: {}});