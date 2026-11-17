const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middleware/auth');

const router = Router();

// /search precisa vir antes de /:id para não ser capturado como id
router.get('/search', categoryController.search);
router.get('/:id', categoryController.show);

router.post('/', authenticate, categoryController.store);
router.put('/:id', authenticate, categoryController.update);
router.delete('/:id', authenticate, categoryController.destroy);

module.exports = router;
