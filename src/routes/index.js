const { Router } = require('express');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');

const router = Router();

// Health check simples para verificar se a API está no ar
router.get('/', (req, res) => res.json({ name: 'Digital Store API', status: 'ok' }));

router.use('/v1/user', userRoutes);
router.use('/v1/category', categoryRoutes);
router.use('/v1/product', productRoutes);

module.exports = router;
