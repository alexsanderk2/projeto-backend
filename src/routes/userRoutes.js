const { Router } = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');

const router = Router();

// Rotas públicas: cadastro e login precisam funcionar sem token
router.post('/token', userController.token);
router.post('/', userController.store);
router.get('/:id', userController.show);

// Rotas protegidas por JWT
router.put('/:id', authenticate, userController.update);
router.delete('/:id', authenticate, userController.destroy);

module.exports = router;
