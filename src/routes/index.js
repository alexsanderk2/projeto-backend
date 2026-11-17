const { Router } = require('express');

const router = Router();

// Health check simples para verificar se a API está no ar
router.get('/', (req, res) => res.json({ name: 'Digital Store API', status: 'ok' }));

module.exports = router;
