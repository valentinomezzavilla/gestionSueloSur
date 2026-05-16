const express    = require('express')
const router     = express.Router()
const auth       = require('../middlewares/auth')
const roles      = require('../middlewares/roles')
const controller = require('../controllers/contenedores.controller')
const alqCtrl    = require('../controllers/alquileres.controller')

const acceso = roles('admin_ventas', 'dueno')

// ── Alquileres (antes de /:id para que no colisione) ───────────
router.get('/alquileres',                     auth, acceso, alqCtrl.index)
router.get('/alquileres/nuevo',               auth, acceso, alqCtrl.nuevo)
router.post('/alquileres',                    auth, acceso, alqCtrl.crear)
router.get('/alquileres/:id',                 auth, acceso, alqCtrl.detalle)
router.post('/alquileres/:id/asignar',        auth, acceso, alqCtrl.asignarContenedor)
router.post('/alquileres/:id/despachar',      auth, acceso, alqCtrl.despachar)
router.post('/alquileres/:id/entregar',       auth, acceso, alqCtrl.entregar)
router.post('/alquileres/:id/retirar',        auth, acceso, alqCtrl.retirar)
router.post('/alquileres/:id/devolver',       auth, acceso, alqCtrl.devolverAPlanta)
router.post('/alquileres/:id/anular',         auth, acceso, alqCtrl.anular)

// ── Catálogo de contenedores ───────────────────────────────────
router.get('/',                  auth, acceso, controller.index)
router.get('/circuito',          auth, acceso, controller.circuito)
router.get('/nuevo',             auth, acceso, controller.nuevo)
router.post('/',                 auth, acceso, controller.crear)
router.get('/:id',               auth, acceso, controller.detalle)
router.get('/:id/editar',        auth, acceso, controller.editar)
router.put('/:id',               auth, acceso, controller.actualizar)
router.post('/:id/toggle',       auth, acceso, controller.toggleActivo)
router.post('/:id/movimiento',   auth, acceso, controller.registrarMovimiento)

module.exports = router
