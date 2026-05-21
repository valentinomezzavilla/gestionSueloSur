const express    = require('express')
const router     = express.Router()
const auth       = require('../middlewares/auth')
const roles      = require('../middlewares/roles')
const controller = require('../controllers/operaciones.controller')

const acceso = roles('admin_ventas', 'dueno')

router.get('/ventas-deposito', auth, acceso, controller.ventasDeposito)
router.get('/entregas',        auth, acceso, controller.entregas)
router.get('/maquinaria',      auth, acceso, controller.maquinaria)

module.exports = router
