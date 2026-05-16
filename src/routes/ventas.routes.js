const express    = require('express')
const router     = express.Router()
const auth       = require('../middlewares/auth')
const roles      = require('../middlewares/roles')
const controller = require('../controllers/ventas.controller')

const acceso = roles('admin_ventas', 'dueno')

router.get('/',           auth, acceso, controller.index)
router.get('/nueva',      auth, acceso, controller.nueva)
router.post('/',          auth, acceso, controller.crear)
router.get('/:id',        auth, acceso, controller.detalle)
router.get('/:id/remito', auth, acceso, controller.remito)

router.post('/:id/despachar', auth, acceso, controller.despachar)
router.post('/:id/entregar',  auth, acceso, controller.entregar)
router.post('/:id/anular',    auth, acceso, controller.anular)

module.exports = router
