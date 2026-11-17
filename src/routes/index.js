const { Router } = require('express');
const userRoutes = require('./userRoutes');

const router = Router();

// Health check simples para verificar se a API está no ar
router.get('/', (req, res) => res.json({ name: 'Digital Store API', status: 'ok' }));

router.use('/v1/user', userRoutes);

module.exports = router;
