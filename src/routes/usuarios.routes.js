const express    = require('express')
const router     = express.Router()
const auth       = require('../middlewares/auth')
const roles      = require('../middlewares/roles')
const controller = require('../controllers/usuarios.controller')

const soloDueno = roles('dueno')

router.get('/',              auth, soloDueno, controller.index)
router.get('/nuevo',         auth, soloDueno, controller.nuevo)
router.post('/',             auth, soloDueno, controller.crear)
router.get('/:id/editar',    auth, soloDueno, controller.editar)
router.put('/:id',           auth, soloDueno, controller.actualizar)
router.post('/:id/toggle',   auth, soloDueno, controller.toggleActivo)

module.exports = router
