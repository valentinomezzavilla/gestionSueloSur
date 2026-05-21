const VentasModel = require('../models/ventas.model')

const OperacionesController = {

  ventasDeposito(req, res) {
    try {
      const { estado, id_cliente } = req.query
      const ops      = VentasModel.listarVentasDeposito({ estado, id_cliente })
      const clientes = VentasModel.listarClientes()
      res.render('pages/operaciones/ventas-deposito', {
        titulo: 'Ventas Depósito',
        ops,
        clientes,
        filtros: req.query,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar las ventas.')
      res.redirect('back')
    }
  },

  entregas(req, res) {
    try {
      const grupos = VentasModel.listarEntregas()
      res.render('pages/operaciones/entregas', {
        titulo: 'Entregas Planificadas',
        grupos,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar las entregas.')
      res.redirect('back')
    }
  },

  maquinaria(req, res) {
    try {
      const { estado } = req.query
      const ops = VentasModel.listarMaquinaria({ estado })
      res.render('pages/operaciones/maquinaria', {
        titulo: 'Maquinaria',
        ops,
        filtros: req.query,
      })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar maquinaria.')
      res.redirect('back')
    }
  },
}

module.exports = OperacionesController
