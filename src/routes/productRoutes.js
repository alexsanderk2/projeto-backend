const { Router } = require('express');
const productController = require('../controllers/productController');
const authenticate = require('../middleware/auth');

const router = Router();

// /search precisa vir antes de /:id para não ser capturado como id
router.get('/search', productController.search);
router.get('/:id', productController.show);

router.post('/', authenticate, productController.store);
router.put('/:id', authenticate, productController.update);
router.delete('/:id', authenticate, productController.destroy);

module.exports = router;
