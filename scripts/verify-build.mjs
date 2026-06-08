#!/usr/bin/env node
/**
 * Verifica las salidas del build antes de desplegar en Netlify.
 *
 * Este proyecto es SSR puro con TanStack Start + Nitro (preset netlify):
 * - `dist/` contiene los assets estáticos (no hay index.html — el HTML lo
 *   genera la función serverless en cada request).
 * - `.netlify/functions-internal/server/server.mjs` es el handler SSR.
 *
 * El redirect en `netlify.toml` envía cualquier ruta al handler, así que la
 * ausencia de index.html es esperada y NO debe abortar el deploy.
 */
import { existsSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PUBLISH_DIR = join(ROOT, "dist");
const NETLIFY_FUNCTION_CANDIDATES = [
  join(ROOT, ".netlify", "functions-internal", "server", "server.mjs"),
  join(ROOT, ".netlify", "functions-internal", "server", "index.mjs"),
  join(ROOT, ".netlify", "functions", "server.mjs"),
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
  if (!existsSync(PUBLISH_DIR) || !statSync(PUBLISH_DIR).isDirectory()) {
    throw new Error(`no existe ${PUBLISH_DIR}. ¿Falló \`vite build\`?`);
  }
  const entries = readdirSync(PUBLISH_DIR);
  if (entries.length === 0) {
    throw new Error(`${PUBLISH_DIR} está vacío`);
  }
});

check("función serverless de Netlify presente", () => {
  const found = NETLIFY_FUNCTION_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    // En builds locales (preset cloudflare) no existe — solo avisar.
    if (process.env.NETLIFY !== "true" && process.env.NITRO_PRESET !== "netlify") {
      warnings.push(
        "no se encontró el handler de Netlify (build local con otro preset, OK).",
      );
      return;
    }
    throw new Error(
      `falta el handler SSR. Buscado en:\n     ${NETLIFY_FUNCTION_CANDIDATES.join("\n     ")}`,
    );
  }
  console.log(`     → ${found}`);
});

if (warnings.length > 0) {
  console.log("\n⚠️  Avisos:");
  for (const w of warnings) console.log(`   - ${w}`);
}

if (errors.length > 0) {
  console.error("\n❌ Build inválido — abortando antes del deploy:\n");
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}

console.log("\n✅ Salida del build válida — listo para desplegar.\n");
