const express    = require('express')
const router     = express.Router()
const auth       = require('../middlewares/auth')
const roles      = require('../middlewares/roles')
const controller = require('../controllers/clientes.controller')

const acceso = roles('admin_ventas', 'dueno')

router.get('/',              auth, acceso, controller.index)
router.get('/nuevo',         auth, acceso, controller.nuevo)
router.post('/',             auth, acceso, controller.crear)
router.get('/:id/editar',    auth, acceso, controller.editar)
router.put('/:id',           auth, acceso, controller.actualizar)
router.post('/:id/toggle',   auth, acceso, controller.toggleActivo)

module.exports = router
