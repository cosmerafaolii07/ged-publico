const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Permite receber dados em JSON (ideal para os documentos digitalizados)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir os ficheiros do projeto (index.html, pasta js, etc.)
app.use(express.static(path.join(__dirname)));

// Rota para garantir que abre sempre o index.html corretamente
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`GED Público Digital a operar na porta ${PORT}`);
});