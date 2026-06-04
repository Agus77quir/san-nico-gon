#!/usr/bin/env node
/**
 * Verifica las salidas del build antes de desplegar.
 * Si falta algún archivo crítico, sale con código != 0 para abortar el deploy.
 *
 * Se ejecuta como postbuild (ver package.json) y también lo invoca
 * netlify.toml después de `vite build`.
 */
import { existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PUBLISH_DIR = join(ROOT, "dist", "client");

const REQUIRED_FILES = [
  "index.html",
];

const REQUIRED_DIRS = [
  "assets", // bundles JS/CSS generados por Vite
];

const errors = [];
const warnings = [];

function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (err) {
    console.log(`  ✗ ${label}`);
    errors.push(`${label}: ${err.message}`);
  }
}

console.log(`\n🔎 Verificando salida del build en: ${PUBLISH_DIR}\n`);

check("publish dir existe", () => {
  if (!existsSync(PUBLISH_DIR)) {
    throw new Error(`no existe ${PUBLISH_DIR}. ¿Falló \`vite build\`?`);
  }
  if (!statSync(PUBLISH_DIR).isDirectory()) {
    throw new Error(`${PUBLISH_DIR} no es un directorio`);
  }
});

if (existsSync(PUBLISH_DIR)) {
  for (const file of REQUIRED_FILES) {
    check(`${file} presente`, () => {
      const p = join(PUBLISH_DIR, file);
      if (!existsSync(p)) {
        throw new Error(
          `falta ${file}. El SPA fallback de Netlify no podrá servirlo y todas las rutas darán 404.`,
        );
      }
      const size = statSync(p).size;
      if (size < 100) {
        warnings.push(`${file} pesa solo ${size} bytes — sospechoso, revisa el build.`);
      }
    });
  }

  for (const dir of REQUIRED_DIRS) {
    check(`directorio ${dir}/ presente`, () => {
      const p = join(PUBLISH_DIR, dir);
      if (!existsSync(p) || !statSync(p).isDirectory()) {
        throw new Error(`falta el directorio ${dir}/. Sin bundles, la app no carga.`);
      }
      const files = readdirSync(p);
      if (files.length === 0) {
        throw new Error(`el directorio ${dir}/ está vacío`);
      }
    });
  }

  // Sanity check del HTML: debe enlazar al menos un módulo JS y al CSS.
  check("index.html enlaza JS y CSS", () => {
    if (!existsSync(join(PUBLISH_DIR, "index.html"))) return; // ya se reportó arriba
    const html = require("node:fs").readFileSync(
      join(PUBLISH_DIR, "index.html"),
      "utf8",
    );
    if (!/<script[^>]+type=["']module["']/i.test(html)) {
      throw new Error("index.html no contiene <script type=\"module\"> — el bundle no se cargará.");
    }
    if (!/<link[^>]+rel=["']stylesheet["']/i.test(html)) {
      warnings.push("index.html no enlaza ningún stylesheet — verifica estilos.");
    }
  });
}

if (warnings.length > 0) {
  console.log("\n⚠️  Avisos:");
  for (const w of warnings) console.log(`   - ${w}`);
}

if (errors.length > 0) {
  console.error("\n❌ Build inválido — abortando antes del deploy:\n");
  for (const e of errors) console.error(`   - ${e}`);
  console.error(
    "\n💡 Si despliegas en Netlify y este proyecto necesita SSR, considera usar el botón Publish de Lovable.\n",
  );
  process.exit(1);
}

console.log("\n✅ Salida del build válida — listo para desplegar.\n");
