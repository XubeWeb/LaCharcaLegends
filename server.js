const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Inyecta el token de Figma en el HTML desde variable de entorno
app.get('/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const script = `<script>window.FIGMA_TOKEN = "${process.env.FIGMA_TOKEN || ''}";</script>`;
  html = html.replace('</head>', script + '</head>');
  res.send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cartas Charca corriendo en puerto ${PORT}`);
});
