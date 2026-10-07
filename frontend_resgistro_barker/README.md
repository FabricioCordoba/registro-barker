# Frontend del Registro Municipal de Aspirantes

Aplicación SPA hecha con React, Vite y React Router. Se comunica con el backend
NestJS para inscripciones, autenticación y administración de registros.

## Requisitos

- Node.js 20 o superior
- npm
- Backend disponible y configurado

## Desarrollo local

```powershell
npm ci
npm run dev
```

Vite lee las variables `VITE_API_REGISTRO`, `VITE_API_AUTH`,
`VITE_API_BASE` y `VITE_RECAPTCHA_SITE_KEY` de `.env.development`.
Configure los endpoints para apuntar a la API y use una clave pública de
reCAPTCHA válida. No guarde claves secretas del backend en variables `VITE_*`:
Vite las incorpora al bundle del navegador.

## Build y lint

```powershell
npm run build
npm run lint
```

El build de producción se genera en `dist/`. El despliegue debe servir
`index.html` como fallback para las rutas de React Router.