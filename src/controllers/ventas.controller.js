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
      const porFinalizar = ContenedoresModel.porFinalizar()
      res.render('pages/ventas/nueva', {
        titulo: 'Nueva Operación',
        clientes,
        productos,
        contenedores,
        porFinalizar,
        productosJson:    JSON.stringify(productos),
        porFinalizarJson: JSON.stringify(porFinalizar),
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el formulario.')
      res.redirect('/ventas')
    }
  },

  crear(req, res) {
    try {
      const {
        id_cliente, cliente_texto, tipo_op, modalidad, observaciones,
        fecha_entrega_planificada, metodo_pago,
        dom_calle, dom_altura, dom_sin_numero, dom_lat, dom_lng,
      } = req.body
      const tipo = tipo_op || 'M'

      // Construir el objeto domicilio si aplica
      const requiereDomicilio = tipo === 'B' || tipo === 'C' || (tipo === 'M' && modalidad === 'flete')
      let domicilio = null
      if (requiereDomicilio) {
        if (!dom_calle?.trim()) {
          req.flash('error', 'Debe completar la calle del domicilio de entrega.')
          return res.redirect('/ventas/nueva')
        }
        domicilio = {
          calle:      dom_calle.trim(),
          altura:     dom_sin_numero ? null : (dom_altura || null),
          sin_numero: !!dom_sin_numero,
          lat:        dom_lat || null,
          lng:        dom_lng || null,
        }
      }

      const opComun = {
        id_cliente:          id_cliente || null,
        cliente_nombre_libre: !id_cliente ? cliente_texto : null,
        id_administrativo:   req.session.user.id,
        observaciones:       observaciones || '',
        fecha_entrega_planificada: fecha_entrega_planificada || null,
        modalidad:           requiereDomicilio ? 'flete' : 'deposito',
        metodo_pago:         metodo_pago || null,
        domicilio,
      }

      if (tipo === 'C') {
        const { plazo_alquiler, precio_alquiler, id_contenedor, id_contenedor_futuro, zona_entrega } = req.body
        // Si eligieron un contenedor "por finalizar", ese tiene prioridad
        const idContFinal = id_contenedor_futuro || id_contenedor
        // Construir el string de domicilio para compatibilidad con op_detalle_contenedor
        const domicilioStr = domicilio
          ? domicilio.sin_numero ? `${domicilio.calle} s/n` : `${domicilio.calle} ${domicilio.altura || ''}`.trim()
          : ''
        const { nro_op, nro_remito } = VentasModel.crear({
          ...opComun,
          tipo_op: 'C',
          contenedor: {
            id_contenedor:    idContFinal || null,
            domicilio_entrega: domicilioStr,
            zona_entrega:      zona_entrega || '',
            plazo_alquiler:    parseInt(plazo_alquiler) || 5,
            precio_alquiler:   parseInt(precio_alquiler) || 0,
          },
        })
        req.flash('success', `Operación creada — Remito N° ${String(nro_remito).padStart(8, '0')}.`)
        return res.redirect('/operaciones/ventas-deposito')
      }

      const getArr = (key) => {
        const v = req.body[key] ?? req.body[key + '[]']
        if (v == null) return []
        return Array.isArray(v) ? v : [v]
      }
      const ids        = getArr('id_producto')
      const cantidades = getArr('cantidad_pedida')
      const precios    = getArr('precio_unitario')

      if (!ids.length || !ids.some(x => x)) {
        req.flash('error', 'Debe agregar al menos un producto.')
        return res.redirect('/ventas/nueva')
      }

      const detalles = ids
        .map((id_producto, i) => ({
          id_producto,
          cantidad_pedida: parseInt(cantidades[i]) || 0,
          precio_unitario: parseInt(precios[i])    || 0,
        }))
        .filter(d => d.id_producto && d.cantidad_pedida > 0)

      if (!detalles.length) {
        req.flash('error', 'Las cantidades deben ser mayores a cero.')
        return res.redirect('/ventas/nueva')
      }

      const { nro_op, nro_remito } = VentasModel.crear({
        ...opComun,
        tipo_op: tipo,
        detalles,
      })

      req.flash('success', `Operación creada — Remito N° ${String(nro_remito).padStart(8, '0')}.`)
      res.redirect('/operaciones/ventas-deposito')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al crear la operación.')
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
