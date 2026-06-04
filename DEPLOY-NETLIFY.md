# Deploy en Netlify desde GitHub

Este proyecto está preparado para desplegarse en **Netlify** sin ajustes manuales.

## Pasos

1. Conecta tu repo de GitHub en [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**.
2. Selecciona el repositorio. Netlify detectará `netlify.toml` automáticamente y usará:
   - **Build command:** `bun run build`
   - **Publish directory:** `dist/client`
   - **NITRO_PRESET:** `netlify` (genera funciones serverless compatibles)
   - **Node:** 20
3. Pulsa **Deploy site**.

## Variables de entorno

Si en el futuro agregas Lovable Cloud u otros secretos (`VITE_*`, claves de API), añádelos en:

**Site settings → Environment variables**

Luego dispara un nuevo deploy.

## Cómo funciona

- El bundler (Vite + Nitro) construye dos salidas:
  - `dist/client/` → estáticos servidos por la CDN de Netlify.
  - `.netlify/functions/server` → handler SSR de TanStack Start como función serverless.
- El redirect `/* → /.netlify/functions/server` (definido en `netlify.toml`) envía a SSR cualquier ruta que no sea un archivo estático.

## Lovable + GitHub + Netlify a la vez

- Editas en Lovable → se sincroniza automáticamente al repo de GitHub.
- Netlify detecta el push y redespliega solo.
- No necesitas tocar nada más.
