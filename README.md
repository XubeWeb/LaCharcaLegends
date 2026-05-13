# 🐸 Cartas Charca — Galería

Galería web de las cartas del juego **Cartas Charca / El Valle Hundido**.  
Las imágenes se cargan directamente desde la API de Figma por node ID, sin necesidad de subir nada.

## Estructura

```
cartas-charca/
├── public/
│   ├── index.html     ← Web principal
│   ├── style.css      ← Estilos
│   ├── app.js         ← Lógica + conexión Figma
│   └── cartas.json    ← Datos de las 88 cartas
├── server.js          ← Servidor Express (para Render)
├── package.json
└── .gitignore
```

## Deploy en Render (gratis)

1. **Sube a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Cartas Charca inicial"
   git branch -M main
   git remote add origin https://github.com/TU_USER/cartas-charca.git
   git push -u origin main
   ```

2. **Crea un Web Service en [render.com](https://render.com):**
   - New → Web Service → conecta tu repo de GitHub
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

3. En ~2 minutos tendrás la URL pública.

## Actualizar cartas

Edita `public/cartas.json` y haz `git push`. Render redespliega automáticamente.

## Nota sobre Figma

Las imágenes se cargan en tiempo real desde Figma usando la API pública.  
Si se hacen muchas peticiones simultáneas puede haber rate limit temporal (se recupera solo).  
El token está en `public/app.js` — cuando quieras rotarlo, cámbialo ahí.
