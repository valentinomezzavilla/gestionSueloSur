const StockModel = require('../models/stock.model')

const StockController = {

  index(req, res) {
    try {
      const stock = StockModel.listar()
      res.render('pages/stock/index', { titulo: 'Stock', stock })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el stock.')
      res.redirect('back')
    }
  },

  ajustar(req, res) {
    const { id_producto } = req.params
    const cantidad_actual = parseFloat(req.body.cantidad_actual) || 0
    const stock_minimo    = parseFloat(req.body.stock_minimo)    || 0
    try {
      StockModel.ajustar(id_producto, { cantidad_actual, stock_minimo })
      req.flash('success', 'Stock actualizado correctamente.')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al actualizar el stock.')
    }
    res.redirect('/stock')
  },

  egresoPage(req, res) {
    try {
      const stock = StockModel.listar()
      res.render('pages/stock/egreso', { titulo: 'Stock — Egreso', stock })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar la página de egreso.')
      res.redirect('/stock')
    }
  },

  egreso(req, res) {
    const { id_producto } = req.params
    const cantidad = parseFloat(req.body.cantidad) || 0
    const motivo   = req.body.motivo || ''
    try {
      if (cantidad <= 0) {
        req.flash('error', 'La cantidad debe ser mayor a cero.')
        return res.redirect('/stock/egreso')
      }
      const item = StockModel.obtener(id_producto)
      if (!item) {
        req.flash('error', 'Producto no encontrado.')
        return res.redirect('/stock/egreso')
      }
      StockModel.registrarEgreso(id_producto, cantidad)
      req.flash('success', `Egreso de ${cantidad} ${item.unidad_medida} de ${item.nombre} registrado${motivo ? ` (${motivo})` : ''}.`)
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al registrar el egreso.')
    }
    res.redirect('/stock/egreso')
  },

  ingreso(req, res) {
    const { id_producto } = req.params
    const cantidad = parseFloat(req.body.cantidad) || 0
    try {
      if (cantidad <= 0) {
        req.flash('error', 'La cantidad debe ser mayor a cero.')
        return res.redirect('/stock')
      }
      const item = StockModel.obtener(id_producto)
      StockModel.registrarIngreso(id_producto, cantidad)
      req.flash('success', `Ingreso de ${cantidad} ${item.unidad_medida} de ${item.nombre} registrado.`)
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al registrar el ingreso.')
    }
    res.redirect('/stock')
  },
}

module.exports = StockController
