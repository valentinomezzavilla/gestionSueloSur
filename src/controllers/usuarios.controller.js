const UsuariosModel = require('../models/usuarios.model')

const UsuariosController = {

  index(req, res) {
    try {
      const usuarios = UsuariosModel.listar()
      res.render('pages/usuarios/index', { titulo: 'Usuarios', usuarios })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar los usuarios.')
      res.redirect('back')
    }
  },

  nuevo(req, res) {
    res.render('pages/usuarios/form', { titulo: 'Nuevo Usuario', usuario: null })
  },

  crear(req, res) {
    try {
      const { usuario, nombre, rol, password, password_confirm } = req.body
      if (!usuario || !nombre || !rol || !password) {
        req.flash('error', 'Todos los campos son obligatorios.')
        return res.redirect('/usuarios/nuevo')
      }
      if (password !== password_confirm) {
        req.flash('error', 'Las contraseñas no coinciden.')
        return res.redirect('/usuarios/nuevo')
      }
      if (UsuariosModel.existeUsuario(usuario)) {
        req.flash('error', `El usuario "${usuario}" ya existe.`)
        return res.redirect('/usuarios/nuevo')
      }
      UsuariosModel.crear({ usuario, nombre, rol, password })
      req.flash('success', `Usuario ${nombre} creado correctamente.`)
      res.redirect('/usuarios')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al crear el usuario.')
      res.redirect('/usuarios/nuevo')
    }
  },

  editar(req, res) {
    try {
      const usuario = UsuariosModel.obtener(req.params.id)
      if (!usuario) {
        req.flash('error', 'Usuario no encontrado.')
        return res.redirect('/usuarios')
      }
      res.render('pages/usuarios/form', { titulo: 'Editar Usuario', usuario })
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cargar el usuario.')
      res.redirect('/usuarios')
    }
  },

  actualizar(req, res) {
    try {
      const { usuario, nombre, rol, password, password_confirm } = req.body
      const id = req.params.id

      if (!usuario || !nombre || !rol) {
        req.flash('error', 'Usuario, nombre y rol son obligatorios.')
        return res.redirect(`/usuarios/${id}/editar`)
      }
      if (password && password !== password_confirm) {
        req.flash('error', 'Las contraseñas no coinciden.')
        return res.redirect(`/usuarios/${id}/editar`)
      }
      if (UsuariosModel.existeUsuario(usuario, id)) {
        req.flash('error', `El usuario "${usuario}" ya está en uso.`)
        return res.redirect(`/usuarios/${id}/editar`)
      }
      UsuariosModel.actualizar(id, { usuario, nombre, rol, password: password || null })
      req.flash('success', 'Usuario actualizado correctamente.')
      res.redirect('/usuarios')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al actualizar el usuario.')
      res.redirect('/usuarios')
    }
  },

  toggleActivo(req, res) {
    try {
      if (req.params.id === req.session.user.id) {
        req.flash('error', 'No podés desactivar tu propia cuenta.')
        return res.redirect('/usuarios')
      }
      UsuariosModel.toggleActivo(req.params.id)
      req.flash('success', 'Estado del usuario actualizado.')
    } catch (err) {
      console.error(err)
      req.flash('error', 'Error al cambiar el estado.')
    }
    res.redirect('/usuarios')
  },
}

module.exports = UsuariosController
