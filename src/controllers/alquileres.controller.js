const AlquileresModel = require('../models/alquileres.model')

const AlquileresController = {

  index(req, res) {
    try {
      const grupos = AlquileresModel.listarPorEstado()
      res.render('pages/contenedores/alquileres/index', {
        titulo: 'Alquileres',
        grupos,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar los alquileres.')
      res.redirect('/contenedores')
    }
  },

  nuevo(req, res) {
    try {
      const clientes    = AlquileresModel.clientes()
      const disponibles = AlquileresModel.contenedoresDisponibles()
      res.render('pages/contenedores/alquileres/nuevo', {
        titulo: 'Nuevo Alquiler',
        clientes,
        disponibles,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el formulario.')
      res.redirect('/contenedores/alquileres')
    }
  },

  crear(req, res) {
    try {
      const { id_cliente, domicilio_entrega, zona_entrega, plazo_alquiler, precio_alquiler, id_contenedor, observaciones } = req.body
      if (!id_cliente || !domicilio_entrega || !plazo_alquiler) {
        req.flash('error', 'Cliente, domicilio y plazo son obligatorios.')
        return res.redirect('/contenedores/alquileres/nuevo')
      }
      const { nro_op } = AlquileresModel.crear({
        id_cliente,
        id_administrativo: req.session.user.id,
        domicilio_entrega,
        zona_entrega,
        plazo_alquiler,
        precio_alquiler,
        id_contenedor: id_contenedor || null,
        observaciones,
      })
      req.flash('success', `Alquiler OP-${String(nro_op).padStart(4, '0')} creado correctamente.`)
      res.redirect('/contenedores/alquileres')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al crear el alquiler.')
      res.redirect('/contenedores/alquileres/nuevo')
    }
  },

  detalle(req, res) {
    try {
      const alquiler    = AlquileresModel.obtener(req.params.id)
      if (!alquiler) {
        req.flash('error', 'Alquiler no encontrado.')
        return res.redirect('/contenedores/alquileres')
      }
      const disponibles = AlquileresModel.contenedoresDisponibles()
      res.render('pages/contenedores/alquileres/detalle', {
        titulo: `Alquiler OP-${String(alquiler.nro_op).padStart(4, '0')}`,
        alquiler,
        disponibles,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el alquiler.')
      res.redirect('/contenedores/alquileres')
    }
  },

  asignarContenedor(req, res) {
    try {
      const { id_contenedor } = req.body
      if (!id_contenedor) {
        req.flash('error', 'Debe seleccionar un contenedor.')
        return res.redirect(`/contenedores/alquileres/${req.params.id}`)
      }
      AlquileresModel.asignarContenedor(req.params.id, id_contenedor)
      req.flash('success', 'Contenedor asignado correctamente.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al asignar el contenedor.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    }
  },

  despachar(req, res) {
    try {
      AlquileresModel.despachar(req.params.id)
      req.flash('success', 'Contenedor despachado — movimiento "en tránsito" registrado.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    } catch (err) {
      console.error(err)
      req.flash('error', err.message || 'Error al despachar.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    }
  },

  entregar(req, res) {
    try {
      AlquileresModel.entregar(req.params.id)
      req.flash('success', 'Entrega confirmada — movimiento "entregado" registrado.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    } catch (err) {
      console.error(err)
      req.flash('error', err.message || 'Error al confirmar entrega.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    }
  },

  retirar(req, res) {
    try {
      AlquileresModel.registrarRetiro(req.params.id)
      req.flash('success', 'Retiro registrado — contenedor en tránsito hacia planta.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    } catch (err) {
      console.error(err)
      req.flash('error', err.message || 'Error al registrar retiro.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    }
  },

  devolverAPlanta(req, res) {
    try {
      AlquileresModel.devolverAPlanta(req.params.id)
      req.flash('success', 'Contenedor devuelto a planta — ciclo de alquiler completado.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    } catch (err) {
      console.error(err)
      req.flash('error', err.message || 'Error al registrar devolución.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    }
  },

  anular(req, res) {
    try {
      AlquileresModel.anular(req.params.id)
      req.flash('success', 'Alquiler anulado correctamente.')
      res.redirect('/contenedores/alquileres')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al anular el alquiler.')
      res.redirect(`/contenedores/alquileres/${req.params.id}`)
    }
  },
}

module.exports = AlquileresController
