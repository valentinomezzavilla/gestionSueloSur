const db = require('../config/db')

const StockModel = {

  listar() {
    return db.prepare(`
      SELECT p.id, p.nombre, p.unidad_medida, p.precio_referencia,
             COALESCE(s.cantidad_actual, 0)         AS cantidad_actual,
             COALESCE(s.cant_pendiente_entregar, 0) AS cant_pendiente_entregar,
             COALESCE(s.stock_minimo, 0)             AS stock_minimo,
             (COALESCE(s.cantidad_actual, 0) - COALESCE(s.cant_pendiente_entregar, 0)) AS disponible_real
      FROM productos p
      LEFT JOIN stock s ON s.id_producto = p.id
      WHERE p.activo = 1
      ORDER BY p.nombre
    `).all()
  },

  ajustar(id_producto, { cantidad_actual, stock_minimo }) {
    db.prepare(`
      UPDATE stock SET cantidad_actual = ?, stock_minimo = ?
      WHERE id_producto = ?
    `).run(cantidad_actual, stock_minimo, id_producto)
  },

  registrarIngreso(id_producto, cantidad) {
    db.prepare(`
      UPDATE stock SET cantidad_actual = cantidad_actual + ?
      WHERE id_producto = ?
    `).run(cantidad, id_producto)
  },

  registrarEgreso(id_producto, cantidad) {
    db.prepare(`
      UPDATE stock SET cantidad_actual = MAX(0, cantidad_actual - ?)
      WHERE id_producto = ?
    `).run(cantidad, id_producto)
  },

  obtener(id_producto) {
    return db.prepare(`
      SELECT p.id, p.nombre, p.unidad_medida,
             COALESCE(s.cantidad_actual, 0) AS cantidad_actual
      FROM productos p
      LEFT JOIN stock s ON s.id_producto = p.id
      WHERE p.id = ?
    `).get(id_producto)
  },
}

module.exports = StockModel
