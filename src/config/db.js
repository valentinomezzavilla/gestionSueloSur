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
    unidad_medida     TEXT NOT NULL DEFAULT 'm³',
    precio_referencia REAL DEFAULT 0,
    activo            INTEGER DEFAULT 1,
    created_at        TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS flota_vehiculos (
    id            TEXT PRIMARY KEY,
    tipo_vehiculo TEXT NOT NULL CHECK (tipo_vehiculo IN ('camion','bobcat')),
    patente       TEXT NOT NULL,
    nombre        TEXT NOT NULL,
    kilometraje   INTEGER DEFAULT 0,
    activo        INTEGER DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS op_encabezado (
    id                TEXT PRIMARY KEY,
    id_cliente        TEXT NOT NULL REFERENCES clientes(id),
    id_administrativo TEXT NOT NULL REFERENCES users(id),
    fecha_emision     TEXT NOT NULL DEFAULT (date('now')),
    tipo_op           TEXT NOT NULL DEFAULT 'M' CHECK (tipo_op IN ('M','C','B')),
    nro_op            INTEGER NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','despachado','entregado','anulado')),
    observaciones     TEXT DEFAULT '',
    created_at        TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS op_detalle_material (
    id              TEXT PRIMARY KEY,
    id_orden_pedido TEXT NOT NULL REFERENCES op_encabezado(id),
    id_producto     TEXT NOT NULL REFERENCES productos(id),
    cantidad_pedida REAL NOT NULL,
    precio_unitario REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock (
    id                      TEXT PRIMARY KEY,
    id_producto             TEXT NOT NULL UNIQUE REFERENCES productos(id),
    cantidad_actual         REAL DEFAULT 0,
    cant_pendiente_entregar REAL DEFAULT 0,
    stock_minimo            REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contenedores (
    id                   TEXT PRIMARY KEY,
    numero_contenedor    INTEGER NOT NULL UNIQUE,
    estado_general       TEXT NOT NULL DEFAULT 'operativo'
                           CHECK (estado_general IN ('operativo','en_reparacion','baja')),
    fecha_ultima_pintada TEXT,
    observaciones        TEXT DEFAULT '',
    activo               INTEGER DEFAULT 1,
    created_at           TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS op_detalle_contenedor (
    id                TEXT PRIMARY KEY,
    id_orden_pedido   TEXT NOT NULL REFERENCES op_encabezado(id),
    id_contenedor     TEXT REFERENCES contenedores(id),
    domicilio_entrega TEXT NOT NULL,
    zona_entrega      TEXT NOT NULL,
    plazo_alquiler    INTEGER NOT NULL DEFAULT 5,
    precio_alquiler   REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS movimiento_contenedor (
    id               TEXT PRIMARY KEY,
    id_contenedor    TEXT NOT NULL REFERENCES contenedores(id),
    id_op_contenedor TEXT REFERENCES op_detalle_contenedor(id),
    id_chofer        TEXT REFERENCES users(id),
    id_camion        TEXT REFERENCES flota_vehiculos(id),
    fecha_movimiento TEXT NOT NULL DEFAULT (datetime('now')),
    estado_paso      TEXT NOT NULL
                       CHECK (estado_paso IN ('entregado','en_alquiler','a_retirar','en_transito','vaciado','en_planta')),
    observaciones    TEXT DEFAULT ''
  );
`)

// Migrations — columnas añadidas en sprints posteriores
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN fecha_entrega_planificada TEXT`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN nro_remito INTEGER`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN modalidad TEXT`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN domicilio_calle TEXT`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN domicilio_altura INTEGER`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN domicilio_sin_numero INTEGER DEFAULT 0`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN domicilio_lat REAL`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN domicilio_lng REAL`) } catch(e) {}
try { db.exec(`ALTER TABLE op_encabezado ADD COLUMN metodo_pago TEXT`) } catch(e) {}

// Áridos se venden por metro cúbico, no tonelada
try { db.exec(`UPDATE productos SET unidad_medida = 'm³' WHERE unidad_medida = 'm³'`) } catch(e) {}

// Seed inicial: un usuario por rol
const seedUsuarios = [
  { usuario: 'valentino',     nombre: 'Valentino Mezzavilla', rol: 'dueno'          },
  { usuario: 'admin_ventas',  nombre: 'Admin Ventas',         rol: 'admin_ventas'   },
  { usuario: 'admin_contable',nombre: 'Admin Contable',       rol: 'admin_contable' },
  { usuario: 'chofer',        nombre: 'Chofer Demo',          rol: 'chofer'         },
]
const insUser = db.prepare(
  `INSERT OR IGNORE INTO users (id, usuario, password_hash, nombre, rol) VALUES (?, ?, ?, ?, ?)`
)
seedUsuarios.forEach(u => {
  const hash = bcrypt.hashSync('suelosur123', 10)
  insUser.run(crypto.randomUUID(), u.usuario, hash, u.nombre, u.rol)
})

// Seed inicial: productos y clientes de ejemplo
const cantProductos = db.prepare('SELECT COUNT(*) AS n FROM productos').get().n
if (cantProductos === 0) {
  const insProd = db.prepare(
    `INSERT INTO productos (id, nombre, unidad_medida, precio_referencia) VALUES (?, ?, ?, ?)`
  )
  ;[
    ['Arena Fina',     'm³', 8500],
    ['Arena Gruesa',   'm³', 7800],
    ['Piedra Partida', 'm³', 9200],
    ['Piedra Bola',    'm³', 8800],
    ['Canto Rodado',   'm³', 10500],
    ['Tosca',          'm³', 5500]
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

// Seed Sprint 1: flota de vehículos
const cantFlota = db.prepare('SELECT COUNT(*) AS n FROM flota_vehiculos').get().n
if (cantFlota === 0) {
  const insFlota = db.prepare(
    `INSERT INTO flota_vehiculos (id, tipo_vehiculo, patente, nombre) VALUES (?, ?, ?, ?)`
  )
  ;[
    ['camion', 'ABC123', 'Camión 1'],
    ['camion', 'DEF456', 'Camión 2'],
    ['camion', 'GHI789', 'Camión 3'],
    ['camion', 'JKL012', 'Camión 4'],
    ['camion', 'MNO345', 'Camión 5'],
    ['bobcat', 'PQR678', 'Bobcat'],
  ].forEach(v => insFlota.run(crypto.randomUUID(), ...v))
}

// Seed Sprint 1: una fila de stock por cada producto
const productosParaStock = db.prepare(
  `SELECT p.id FROM productos p
   WHERE p.activo = 1
     AND NOT EXISTS (SELECT 1 FROM stock s WHERE s.id_producto = p.id)`
).all()
if (productosParaStock.length) {
  const insStock = db.prepare(
    `INSERT INTO stock (id, id_producto, cantidad_actual, cant_pendiente_entregar, stock_minimo)
     VALUES (?, ?, 0, 0, 0)`
  )
  productosParaStock.forEach(p => insStock.run(crypto.randomUUID(), p.id))
}

// Seed Sprint 2: 10 contenedores de ejemplo (admin puede agregar más sin límite)
const cantContenedores = db.prepare('SELECT COUNT(*) AS n FROM contenedores').get().n
if (cantContenedores === 0) {
  const insCont = db.prepare(
    `INSERT INTO contenedores (id, numero_contenedor, estado_general) VALUES (?, ?, 'operativo')`
  )
  const insMov = db.prepare(
    `INSERT INTO movimiento_contenedor (id, id_contenedor, estado_paso, observaciones)
     VALUES (?, ?, 'en_planta', 'Alta inicial')`
  )
  for (let n = 1; n <= 10; n++) {
    const id = crypto.randomUUID()
    insCont.run(id, n)
    insMov.run(crypto.randomUUID(), id)
  }
}

module.exports = db
