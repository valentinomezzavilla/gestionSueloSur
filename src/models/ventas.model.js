const crypto = require('crypto')
const db = require('../config/db')

const VentasModel = {

  // ── Auxiliares para el formulario ──────────────────────────────

  listarClientes() {
    return db.prepare(`
      SELECT id, nombre FROM clientes WHERE activo = 1 ORDER BY nombre
    `).all()
  },

  listarProductos() {
    return db.prepare(`
      SELECT p.id, p.nombre, p.unidad_medida, p.precio_referencia,
             (COALESCE(s.cantidad_actual, 0) - COALESCE(s.cant_pendiente_entregar, 0)) AS disponible_real
      FROM productos p
      LEFT JOIN stock s ON s.id_producto = p.id
      WHERE p.activo = 1
      ORDER BY p.nombre
    `).all()
  },

  // ── CRUD de OPs ────────────────────────────────────────────────

  contarPorEstado() {
    return db.prepare(`
      SELECT estado, COUNT(*) AS total FROM op_encabezado GROUP BY estado
    `).all()
  },

  listar({ estado, id_cliente, page = 1, limit = 20 } = {}) {
    const wheres = []
    const params = []
    if (estado)     { wheres.push('op.estado = ?');     params.push(estado) }
    if (id_cliente) { wheres.push('op.id_cliente = ?'); params.push(id_cliente) }
    const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : ''

    const offset = (page - 1) * limit
    const total  = db.prepare(`
      SELECT COUNT(*) AS n FROM op_encabezado op ${where}
    `).get(...params).n

    const ops = db.prepare(`
      SELECT op.id, op.nro_op, op.tipo_op, op.estado, op.fecha_emision,
             c.nombre AS cliente_nombre,
             u.nombre AS administrativo_nombre,
             (SELECT COALESCE(SUM(d.cantidad_pedida * d.precio_unitario), 0)
              FROM op_detalle_material d WHERE d.id_orden_pedido = op.id) AS total
      FROM op_encabezado op
      JOIN clientes c ON c.id = op.id_cliente
      JOIN users    u ON u.id = op.id_administrativo
      ${where}
      ORDER BY op.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset)

    return {
      ops,
      total,
      page,
      limit,
      totalPaginas: Math.ceil(total / limit),
    }
  },

  obtener(id) {
    const op = db.prepare(`
      SELECT op.*, c.nombre AS cliente_nombre, c.tel_whatsapp, c.domicilio_ppal,
             u.nombre AS administrativo_nombre
      FROM op_encabezado op
      JOIN clientes c ON c.id = op.id_cliente
      JOIN users    u ON u.id = op.id_administrativo
      WHERE op.id = ?
    `).get(id)
    if (!op) return null

    if (op.tipo_op === 'C') {
      op.contenedor = db.prepare(`
        SELECT oc.*, c.numero_contenedor
        FROM op_detalle_contenedor oc
        LEFT JOIN contenedores c ON c.id = oc.id_contenedor
        WHERE oc.id_orden_pedido = ?
        LIMIT 1
      `).get(id)
      op.detalles = []
      op.total = op.contenedor?.precio_alquiler || 0
    } else {
      op.detalles = db.prepare(`
        SELECT d.*, p.nombre AS producto_nombre, p.unidad_medida,
               (d.cantidad_pedida * d.precio_unitario) AS subtotal
        FROM op_detalle_material d
        JOIN productos p ON p.id = d.id_producto
        WHERE d.id_orden_pedido = ?
      `).all(id)
      op.total = op.detalles.reduce((sum, d) => sum + d.subtotal, 0)
    }
    return op
  },

  crear({ id_cliente, id_administrativo, tipo_op = 'M', observaciones = '', detalles, contenedor }) {
    const { nro } = db.prepare(
      `SELECT COALESCE(MAX(nro_op), 0) + 1 AS nro FROM op_encabezado`
    ).get()
    const id = crypto.randomUUID()

    const insertOP = db.prepare(`
      INSERT INTO op_encabezado (id, id_cliente, id_administrativo, tipo_op, nro_op, estado, observaciones)
      VALUES (?, ?, ?, ?, ?, 'pendiente', ?)
    `)
    const insertDetalle = db.prepare(`
      INSERT INTO op_detalle_material (id, id_orden_pedido, id_producto, cantidad_pedida, precio_unitario)
      VALUES (?, ?, ?, ?, ?)
    `)
    const sumarPendiente = db.prepare(`
      UPDATE stock SET cant_pendiente_entregar = cant_pendiente_entregar + ?
      WHERE id_producto = ?
    `)
    const insertContenedor = db.prepare(`
      INSERT INTO op_detalle_contenedor
        (id, id_orden_pedido, id_contenedor, domicilio_entrega, zona_entrega, plazo_alquiler, precio_alquiler)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    db.transaction(() => {
      insertOP.run(id, id_cliente, id_administrativo, tipo_op, nro, observaciones)

      if (tipo_op === 'C' && contenedor) {
        insertContenedor.run(
          crypto.randomUUID(), id,
          contenedor.id_contenedor || null,
          contenedor.domicilio_entrega, contenedor.zona_entrega,
          contenedor.plazo_alquiler, contenedor.precio_alquiler || 0
        )
      } else {
        for (const d of (detalles || [])) {
          insertDetalle.run(crypto.randomUUID(), id, d.id_producto, d.cantidad_pedida, d.precio_unitario)
          if (tipo_op === 'M') sumarPendiente.run(d.cantidad_pedida, d.id_producto)
        }
      }
    })()

    return { id, nro_op: nro }
  },

  despachar(id) {
    db.prepare(`
      UPDATE op_encabezado SET estado = 'despachado'
      WHERE id = ? AND estado = 'pendiente'
    `).run(id)
  },

  entregar(id) {
    const op = db.prepare(`SELECT tipo_op FROM op_encabezado WHERE id = ?`).get(id)
    if (!op) return

    db.transaction(() => {
      db.prepare(`
        UPDATE op_encabezado SET estado = 'entregado'
        WHERE id = ? AND estado IN ('pendiente','despachado')
      `).run(id)

      if (op.tipo_op === 'C') {
        const oc = db.prepare(
          `SELECT id, id_contenedor FROM op_detalle_contenedor WHERE id_orden_pedido = ? LIMIT 1`
        ).get(id)
        if (oc && oc.id_contenedor) {
          db.prepare(`
            INSERT INTO movimiento_contenedor (id, id_contenedor, id_op_contenedor, estado_paso, observaciones)
            VALUES (?, ?, ?, 'entregado', 'Entrega registrada desde OP')
          `).run(crypto.randomUUID(), oc.id_contenedor, oc.id)
        }
      } else {
        const detalles = db.prepare(`
          SELECT id_producto, cantidad_pedida FROM op_detalle_material WHERE id_orden_pedido = ?
        `).all(id)
        for (const d of detalles) {
          db.prepare(`
            UPDATE stock
            SET cantidad_actual         = cantidad_actual - ?,
                cant_pendiente_entregar = cant_pendiente_entregar - ?
            WHERE id_producto = ?
          `).run(d.cantidad_pedida, d.cantidad_pedida, d.id_producto)
        }
      }
    })()
  },

  anular(id) {
    const op = db.prepare(`SELECT estado, tipo_op FROM op_encabezado WHERE id = ?`).get(id)
    if (!op || op.estado === 'anulado' || op.estado === 'entregado') return

    db.transaction(() => {
      db.prepare(`UPDATE op_encabezado SET estado = 'anulado' WHERE id = ?`).run(id)

      if (op.tipo_op === 'M') {
        const detalles = db.prepare(`
          SELECT id_producto, cantidad_pedida FROM op_detalle_material WHERE id_orden_pedido = ?
        `).all(id)
        for (const d of detalles) {
          db.prepare(`
            UPDATE stock SET cant_pendiente_entregar = cant_pendiente_entregar - ?
            WHERE id_producto = ?
          `).run(d.cantidad_pedida, d.id_producto)
        }
      }
      // Para tipo 'C' o 'B' no hay impacto en stock; si el contenedor ya estaba
      // entregado, el admin debe registrar el retiro manualmente desde el detalle.
    })()
  },
}

module.exports = VentasModel
