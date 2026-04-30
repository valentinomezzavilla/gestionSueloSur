const path = require('path')
const crypto = require('crypto')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')

const dbPath = path.join(__dirname, '..', '..', 'data', 'suelosur.db')
require('fs').mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    usuario       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre        TEXT NOT NULL,
    rol           TEXT NOT NULL CHECK (rol IN ('admin_ventas','admin_contable','chofer','dueno')),
    activo        INTEGER DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id              TEXT PRIMARY KEY,
    nombre          TEXT NOT NULL,
    domicilio_ppal  TEXT,
    zona            TEXT,
    tel_whatsapp    TEXT,
    tipo_cliente    TEXT,
    activo          INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS productos (
    id                TEXT PRIMARY KEY,
    nombre            TEXT NOT NULL,
    unidad_medida     TEXT NOT NULL DEFAULT 'Tonelada',
    precio_referencia REAL DEFAULT 0,
    activo            INTEGER DEFAULT 1,
    created_at        TEXT DEFAULT (datetime('now'))
  );
`)

// Seed inicial: usuario de prueba 'valentino'
const existeUser = db.prepare('SELECT 1 FROM users WHERE usuario = ?').get('valentino')
if (!existeUser) {
  const hash = bcrypt.hashSync('suelosur123', 10)
  db.prepare(
    `INSERT INTO users (id, usuario, password_hash, nombre, rol)
     VALUES (?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), 'valentino', hash, 'Valentino', 'dueno')
  console.log('🌱 Usuario seed creado: valentino / suelosur123')
}

// Seed inicial: productos y clientes de ejemplo
const cantProductos = db.prepare('SELECT COUNT(*) AS n FROM productos').get().n
if (cantProductos === 0) {
  const insProd = db.prepare(
    `INSERT INTO productos (id, nombre, unidad_medida, precio_referencia) VALUES (?, ?, ?, ?)`
  )
  ;[
    ['Arena Fina',     'Tonelada', 8500],
    ['Arena Gruesa',   'Tonelada', 7800],
    ['Piedra Partida', 'Tonelada', 9200],
    ['Piedra Bola',    'Tonelada', 8800],
    ['Canto Rodado',   'Tonelada', 10500],
    ['Tosca',          'Tonelada', 5500]
  ].forEach(p => insProd.run(crypto.randomUUID(), ...p))
}

const cantClientes = db.prepare('SELECT COUNT(*) AS n FROM clientes').get().n
if (cantClientes === 0) {
  const insCli = db.prepare(
    `INSERT INTO clientes (id, nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  ;[
    ['Construcciones Norte SRL', 'Av. Vélez Sársfield 3200', 'Norte',  '3514001234', 'Empresa'],
    ['García, Roberto',          'Colón 1420',               'Centro', '3513009876', 'Particular'],
    ['Obra Bv. Chacabuco',       'Bv. Chacabuco 890',        'Sur',    '3512005678', 'Obra']
  ].forEach(c => insCli.run(crypto.randomUUID(), ...c))
}

module.exports = db
