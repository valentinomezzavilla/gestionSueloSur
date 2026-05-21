const VentasModel       = require('../models/ventas.model')
const ContenedoresModel = require('../models/contenedores.model')

const VentasController = {

  index(req, res) {
    try {
      const { estado, id_cliente, page } = req.query
      const paginacion = VentasModel.listar({
        estado,
        id_cliente,
        page:  parseInt(page) || 1,
        limit: 20,
      })
      const clientes  = VentasModel.listarClientes()
      const resumen   = VentasModel.contarPorEstado()
      res.render('pages/ventas/index', {
        titulo: 'Ventas',
        ...paginacion,
        clientes,
        resumen,
        filtros: req.query,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar las órdenes de pedido.')
      res.redirect('back')
    }
  },

  nueva(req, res) {
    try {
      const clientes     = VentasModel.listarClientes()
      const productos    = VentasModel.listarProductos()
      const contenedores = ContenedoresModel.disponibles()
      res.render('pages/ventas/nueva', {
        titulo: 'Nueva Operación',
        clientes,
        productos,
        contenedores,
        productosJson: JSON.stringify(productos),
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el formulario.')
      res.redirect('/ventas')
    }
  },

  crear(req, res) {
    try {
      const { id_cliente, tipo_op, observaciones, fecha_entrega_planificada } = req.body
      const tipo = tipo_op || 'M'

      if (tipo === 'C') {
        const { domicilio_entrega, zona_entrega, plazo_alquiler, precio_alquiler, id_contenedor } = req.body
        if (!domicilio_entrega || !zona_entrega) {
          req.flash('error', 'Debe completar domicilio y zona de entrega.')
          return res.redirect('/ventas/nueva')
        }
        const { nro_op } = VentasModel.crear({
          id_cliente,
          id_administrativo: req.session.user.id,
          tipo_op: 'C',
          observaciones: observaciones || '',
          fecha_entrega_planificada: fecha_entrega_planificada || null,
          contenedor: {
            id_contenedor:     id_contenedor || null,
            domicilio_entrega,
            zona_entrega,
            plazo_alquiler:    parseInt(plazo_alquiler) || 5,
            precio_alquiler:   parseFloat(precio_alquiler) || 0,
          },
        })
        req.flash('success', `Orden de Pedido OP-${String(nro_op).padStart(4, '0')} creada correctamente.`)
        return res.redirect('/ventas')
      }

      const ids        = [].concat(req.body['id_producto[]']     || [])
      const cantidades = [].concat(req.body['cantidad_pedida[]'] || [])
      const precios    = [].concat(req.body['precio_unitario[]'] || [])

      if (!ids.length) {
        req.flash('error', 'Debe agregar al menos un producto.')
        return res.redirect('/ventas/nueva')
      }

      const detalles = ids
        .map((id_producto, i) => ({
          id_producto,
          cantidad_pedida: parseFloat(cantidades[i]) || 0,
          precio_unitario: parseFloat(precios[i])    || 0,
        }))
        .filter(d => d.cantidad_pedida > 0)

      if (!detalles.length) {
        req.flash('error', 'Las cantidades deben ser mayores a cero.')
        return res.redirect('/ventas/nueva')
      }

      const { nro_op } = VentasModel.crear({
        id_cliente,
        id_administrativo: req.session.user.id,
        tipo_op: tipo,
        observaciones: observaciones || '',
        fecha_entrega_planificada: fecha_entrega_planificada || null,
        detalles,
      })

      req.flash('success', `Orden de Pedido OP-${String(nro_op).padStart(4, '0')} creada correctamente.`)
      res.redirect('/ventas')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al crear la orden de pedido.')
      res.redirect('/ventas/nueva')
    }
  },

  detalle(req, res) {
    try {
      const op = VentasModel.obtener(req.params.id)
      if (!op) {
        req.flash('error', 'Orden de pedido no encontrada.')
        return res.redirect('/ventas')
      }
      res.render('pages/ventas/detalle', {
        titulo: `OP-${String(op.nro_op).padStart(4, '0')}`,
        op,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar la orden de pedido.')
      res.redirect('/ventas')
    }
  },

  despachar(req, res) {
    try {
      VentasModel.despachar(req.params.id)
      req.flash('success', 'Orden marcada como despachada.')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al despachar la orden.')
    }
    res.redirect(`/ventas/${req.params.id}`)
  },

  entregar(req, res) {
    try {
      VentasModel.entregar(req.params.id)
      return res.redirect(`/ventas/${req.params.id}/remito`)
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al confirmar la entrega.')
      res.redirect(`/ventas/${req.params.id}`)
    }
  },

  anular(req, res) {
    try {
      VentasModel.anular(req.params.id)
      req.flash('warning', 'Orden anulada. Stock pendiente liberado.')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al anular la orden.')
    }
    res.redirect('/ventas')
  },

  remito(req, res) {
    try {
      const op = VentasModel.obtener(req.params.id)
      if (!op) {
        req.flash('error', 'Orden de pedido no encontrada.')
        return res.redirect('/ventas')
      }
      res.render('pages/ventas/remito', {
        titulo: `Remito OP-${String(op.nro_op).padStart(4, '0')}`,
        layout: false,
        op,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al generar el remito.')
      res.redirect(`/ventas/${req.params.id}`)
    }
  },
}

module.exports = VentasController
