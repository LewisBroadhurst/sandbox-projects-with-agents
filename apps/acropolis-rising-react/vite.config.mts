import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command }) => ({
	// GitHub Pages serves project sites under /<repo-name>/, and we host each
	// app in its own subfolder so the repo can publish several. Production
	// builds need /<repo-name>/<app>/ as the base path; dev/preview stay at
	// root ('/'). Override with VITE_BASE_PATH (e.g. '/' for a custom domain).
	base: command === 'build' ? (process.env.VITE_BASE_PATH ?? '/sandbox-projects-with-agents/acropolis-rising-react/') : '/',
	root: import.meta.dirname,
	cacheDir: '../../node_modules/.vite/apps/acropolis-rising-react',
	server: {
		port: 4200,
		host: 'localhost',
	},
	preview: {
		port: 4200,
		host: 'localhost',
	},
	plugins: [react()],
	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [],
	// },
	build: {
		emptyOutDir: true,
		transformMixedEsModules: true,
		outDir: './dist',
		reportCompressedSize: true,
		commonjsOptions: { transformMixedEsModules: true },
	},
	test: {
		name: '@org/acropolis-rising-react',
		watch: false,
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		reporters: ['default'],
		coverage: {
			reportsDirectory: './test-output/vitest/coverage',
			provider: 'v8' as const,
		},
	},
}));
