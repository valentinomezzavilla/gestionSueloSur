const crypto = require('crypto')
const db = require('../config/db')

const ClientesModel = {

  listar() {
    return db.prepare(`
      SELECT * FROM clientes ORDER BY nombre
    `).all()
  },

  obtener(id) {
    return db.prepare(`SELECT * FROM clientes WHERE id = ?`).get(id)
  },

  crear({ nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente }) {
    const id = crypto.randomUUID()
    db.prepare(`
      INSERT INTO clientes (id, nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, nombre, domicilio_ppal || '', zona || '', tel_whatsapp || '', tipo_cliente || '')
    return id
  },

  actualizar(id, { nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente }) {
    db.prepare(`
      UPDATE clientes SET nombre = ?, domicilio_ppal = ?, zona = ?, tel_whatsapp = ?, tipo_cliente = ?
      WHERE id = ?
    `).run(nombre, domicilio_ppal || '', zona || '', tel_whatsapp || '', tipo_cliente || '', id)
  },

  toggleActivo(id) {
    db.prepare(`UPDATE clientes SET activo = NOT activo WHERE id = ?`).run(id)
  },
}

module.exports = ClientesModel
