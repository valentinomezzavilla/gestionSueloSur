const ClientesModel = require('../models/clientes.model')

const ClientesController = {

  index(req, res) {
    try {
      const clientes = ClientesModel.listar()
      res.render('pages/clientes/index', { titulo: 'Clientes', clientes })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar los clientes.')
      res.redirect('back')
    }
  },

  nuevo(req, res) {
    res.render('pages/clientes/form', { titulo: 'Nuevo Cliente', cliente: null })
  },

  crear(req, res) {
    try {
      const { nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente } = req.body
      if (!nombre) {
        req.flash('error', 'El nombre es obligatorio.')
        return res.redirect('/clientes/nuevo')
      }
      ClientesModel.crear({ nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente })
      req.flash('success', 'Cliente creado correctamente.')
      res.redirect('/clientes')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al crear el cliente.')
      res.redirect('/clientes/nuevo')
    }
  },

  editar(req, res) {
    try {
      const cliente = ClientesModel.obtener(req.params.id)
      if (!cliente) {
        req.flash('error', 'Cliente no encontrado.')
        return res.redirect('/clientes')
      }
      res.render('pages/clientes/form', { titulo: 'Editar Cliente', cliente })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el cliente.')
      res.redirect('/clientes')
    }
  },

  actualizar(req, res) {
    try {
      const { nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente } = req.body
      if (!nombre) {
        req.flash('error', 'El nombre es obligatorio.')
        return res.redirect(`/clientes/${req.params.id}/editar`)
      }
      ClientesModel.actualizar(req.params.id, { nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente })
      req.flash('success', 'Cliente actualizado correctamente.')
      res.redirect('/clientes')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al actualizar el cliente.')
      res.redirect('/clientes')
    }
  },

  toggleActivo(req, res) {
    try {
      ClientesModel.toggleActivo(req.params.id)
      req.flash('success', 'Estado del cliente actualizado.')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cambiar el estado.')
    }
    res.redirect('/clientes')
  },
}

module.exports = ClientesController
