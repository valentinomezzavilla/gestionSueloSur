const ProductosModel = require('../models/productos.model')

const ProductosController = {

  index(req, res) {
    try {
      const productos = ProductosModel.listar()
      res.render('pages/productos/index', { titulo: 'Productos', productos })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar los productos.')
      res.redirect('back')
    }
  },

  nuevo(req, res) {
    res.render('pages/productos/form', { titulo: 'Nuevo Producto', producto: null })
  },

  crear(req, res) {
    try {
      const { nombre, unidad_medida, precio_referencia } = req.body
      if (!nombre) {
        req.flash('error', 'El nombre es obligatorio.')
        return res.redirect('/productos/nuevo')
      }
      ProductosModel.crear({ nombre, unidad_medida, precio_referencia })
      req.flash('success', 'Producto creado correctamente.')
      res.redirect('/productos')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al crear el producto.')
      res.redirect('/productos/nuevo')
    }
  },

  editar(req, res) {
    try {
      const producto = ProductosModel.obtener(req.params.id)
      if (!producto) {
        req.flash('error', 'Producto no encontrado.')
        return res.redirect('/productos')
      }
      res.render('pages/productos/form', { titulo: 'Editar Producto', producto })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el producto.')
      res.redirect('/productos')
    }
  },

  actualizar(req, res) {
    try {
      const { nombre, unidad_medida, precio_referencia } = req.body
      if (!nombre) {
        req.flash('error', 'El nombre es obligatorio.')
        return res.redirect(`/productos/${req.params.id}/editar`)
      }
      ProductosModel.actualizar(req.params.id, { nombre, unidad_medida, precio_referencia })
      req.flash('success', 'Producto actualizado correctamente.')
      res.redirect('/productos')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al actualizar el producto.')
      res.redirect('/productos')
    }
  },

  toggleActivo(req, res) {
    try {
      ProductosModel.toggleActivo(req.params.id)
      req.flash('success', 'Estado del producto actualizado.')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cambiar el estado.')
    }
    res.redirect('/productos')
  },
}

module.exports = ProductosController
