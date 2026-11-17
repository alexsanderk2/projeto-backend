/**
 * Configuração da aplicação Express (middlewares, rotas e tratamento de erros).
 * Separado do server.js para facilitar os testes com o supertest.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
// Limite maior por causa das imagens enviadas em base64
app.use(express.json({ limit: '20mb' }));

// Arquivos estáticos (imagens dos produtos)
app.use('/media', express.static(path.resolve(__dirname, '..', 'public', 'media')));

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
