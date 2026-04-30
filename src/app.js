const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const session = require('express-session')
const flash = require('connect-flash')
const methodOverride = require('method-override')

const app = express()

// Motor de vistas
app.set('view engine', 'ejs')
app.set('views', './views')
app.use(expressLayouts)
app.set('layout', 'layouts/main')

// Middlewares globales
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride('_method'))
app.use(express.static('public'))

// Sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-cambiar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}))

// Flash messages
app.use(flash())

// Pasar flash y user a TODAS las vistas automáticamente
app.use((req, res, next) => {
  res.locals.user    = req.session.user || null
  res.locals.success = req.flash('success')
  res.locals.error   = req.flash('error')
  res.locals.warning = req.flash('warning')
  next()
})

// ── Rutas ──────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth.routes'))

// Placeholder rutas de módulos (se van agregando sprint a sprint)
app.get('/dashboard', require('./middlewares/auth'), (req, res) => {
  res.render('pages/dashboard', { titulo: 'Dashboard' })
})

app.get('/ventas', require('./middlewares/auth'), (req, res) => {
  res.render('pages/placeholder', { titulo: 'Ventas', icono: '📋' })
})

app.get('/contenedores', require('./middlewares/auth'), (req, res) => {
  res.render('pages/placeholder', { titulo: 'Contenedores', icono: '📦' })
})

app.get('/stock', require('./middlewares/auth'), (req, res) => {
  res.render('pages/placeholder', { titulo: 'Stock', icono: '🏗️' })
})

app.get('/cobranzas', require('./middlewares/auth'), (req, res) => {
  res.render('pages/placeholder', { titulo: 'Cobranzas', icono: '💰' })
})

app.get('/hoja-de-ruta', require('./middlewares/auth'), (req, res) => {
  res.render('pages/placeholder', { titulo: 'Mi Hoja de Ruta', icono: '🚛' })
})

// Ruta raíz
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login')
  const destinos = {
    dueno: '/dashboard',
    admin_ventas: '/ventas',
    admin_contable: '/cobranzas',
    chofer: '/hoja-de-ruta'
  }
  res.redirect(destinos[req.session.user.rol] || '/dashboard')
})

// 404
app.use((req, res) => {
  res.status(404).render('pages/error', { mensaje: 'Página no encontrada.' })
})

module.exports = app
