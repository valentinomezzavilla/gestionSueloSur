const express    = require('express')
const router     = express.Router()
const auth       = require('../middlewares/auth')
const roles      = require('../middlewares/roles')
const controller = require('../controllers/stock.controller')

router.get('/',        auth, roles('admin_ventas', 'dueno'), controller.index)
router.get('/egreso',  auth, roles('admin_ventas', 'dueno'), controller.egresoPage)

router.post('/:id_producto/ajustar', auth, roles('admin_ventas', 'dueno'), controller.ajustar)
router.post('/:id_producto/ingreso', auth, roles('admin_ventas', 'dueno'), controller.ingreso)
router.post('/:id_producto/egreso',  auth, roles('admin_ventas', 'dueno'), controller.egreso)

module.exports = router
