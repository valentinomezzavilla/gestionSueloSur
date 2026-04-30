const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../config/db')

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/')
  res.render('pages/auth/login', { layout: 'layouts/auth' })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { usuario, password } = req.body

  try {
    const user = db
      .prepare('SELECT * FROM users WHERE usuario = ? AND activo = 1')
      .get(usuario)

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      req.flash('error', 'Usuario o contraseña incorrectos.')
      return res.redirect('/auth/login')
    }

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol
    }

    const destinos = {
      dueno: '/dashboard',
      admin_ventas: '/ventas',
      admin_contable: '/cobranzas',
      chofer: '/hoja-de-ruta'
    }

    req.flash('success', `Bienvenido, ${user.nombre}`)
    res.redirect(destinos[user.rol] || '/')
  } catch (err) {
    console.error('Error en login:', err)
    req.flash('error', 'Error interno. Intentá de nuevo.')
    res.redirect('/auth/login')
  }
})

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login')
  })
})

module.exports = router
