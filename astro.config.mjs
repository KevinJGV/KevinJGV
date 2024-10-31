// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://kevinjgv.github.io',
    base: '/KevinJGV/',
    outDir: 'docs',
    trailingSlash: 'never'
});