const crypto = require('crypto')
const db = require('../config/db')

const ProductosModel = {

  listar() {
    return db.prepare(`SELECT * FROM productos ORDER BY nombre`).all()
  },

  obtener(id) {
    return db.prepare(`SELECT * FROM productos WHERE id = ?`).get(id)
  },

  crear({ nombre, unidad_medida, precio_referencia }) {
    const id = crypto.randomUUID()
    db.prepare(`
      INSERT INTO productos (id, nombre, unidad_medida, precio_referencia)
      VALUES (?, ?, ?, ?)
    `).run(id, nombre, unidad_medida || 'Tonelada', parseFloat(precio_referencia) || 0)

    // Crear fila de stock automáticamente
    db.prepare(`
      INSERT INTO stock (id, id_producto, cantidad_actual, cant_pendiente_entregar, stock_minimo)
      VALUES (?, ?, 0, 0, 0)
    `).run(crypto.randomUUID(), id)

    return id
  },

  actualizar(id, { nombre, unidad_medida, precio_referencia }) {
    db.prepare(`
      UPDATE productos SET nombre = ?, unidad_medida = ?, precio_referencia = ?
      WHERE id = ?
    `).run(nombre, unidad_medida || 'Tonelada', parseFloat(precio_referencia) || 0, id)
  },

  toggleActivo(id) {
    db.prepare(`UPDATE productos SET activo = NOT activo WHERE id = ?`).run(id)
  },
}

module.exports = ProductosModel
