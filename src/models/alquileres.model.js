const crypto = require('crypto')
const db = require('../config/db')

const SQL_ULTIMO_MOV = `
  SELECT m.*
  FROM (
    SELECT m.*,
           ROW_NUMBER() OVER (
             PARTITION BY id_contenedor
             ORDER BY fecha_movimiento DESC, rowid DESC
           ) AS rn
    FROM movimiento_contenedor m
  ) m
  WHERE m.rn = 1
`

const AlquileresModel = {

  listar({ estado, id_cliente } = {}) {
    const wheres = [`op.tipo_op = 'C'`]
    const params = []
    if (estado)     { wheres.push('op.estado = ?');     params.push(estado) }
    if (id_cliente) { wheres.push('op.id_cliente = ?'); params.push(id_cliente) }

    return db.prepare(`
      SELECT op.id, op.nro_op, op.estado, op.fecha_emision, op.observaciones,
             cli.nombre AS cliente_nombre,
             u.nombre   AS administrativo_nombre,
             oc.id AS id_op_contenedor, oc.domicilio_entrega, oc.zona_entrega,
             oc.plazo_alquiler, oc.precio_alquiler, oc.id_contenedor,
             cont.numero_contenedor,
             um.estado_paso AS contenedor_estado,
             CAST((julianday('now') - julianday(um.fecha_movimiento)) AS INTEGER) AS dias_en_estado
      FROM op_encabezado op
      JOIN clientes cli ON cli.id = op.id_cliente
      JOIN users u ON u.id = op.id_administrativo
      LEFT JOIN op_detalle_contenedor oc ON oc.id_orden_pedido = op.id
      LEFT JOIN contenedores cont ON cont.id = oc.id_contenedor
      LEFT JOIN (${SQL_ULTIMO_MOV}) um ON um.id_contenedor = oc.id_contenedor
      WHERE ${wheres.join(' AND ')}
      ORDER BY op.created_at DESC
    `).all(...params)
  },

  // 3 tablas para el módulo Contenedores:
  // - actuales: en curso (op entregada, contenedor en domicilio)
  // - porFinalizar: actuales cuyo plazo termina mañana o antes
  // - programados: op pendiente (no despachada todavía)
  listarPorEstado() {
    const baseSelect = `
      SELECT op.id, op.nro_op, op.nro_remito, op.estado, op.fecha_emision, op.fecha_entrega_planificada,
             cli.nombre AS cliente_nombre, cli.tel_whatsapp,
             oc.id AS id_op_contenedor, oc.domicilio_entrega, oc.zona_entrega,
             oc.plazo_alquiler, oc.precio_alquiler, oc.id_contenedor,
             cont.numero_contenedor,
             um.estado_paso AS contenedor_estado,
             um.fecha_movimiento AS fecha_entrega_real,
             date(substr(um.fecha_movimiento, 1, 10), '+' || oc.plazo_alquiler || ' days') AS fecha_fin_estimada,
             CAST(julianday(date(substr(um.fecha_movimiento, 1, 10), '+' || oc.plazo_alquiler || ' days')) - julianday('now') AS INTEGER) AS dias_restantes,
             CAST((julianday('now') - julianday(um.fecha_movimiento)) AS INTEGER) AS dias_en_estado
      FROM op_encabezado op
      JOIN clientes cli ON cli.id = op.id_cliente
      LEFT JOIN op_detalle_contenedor oc ON oc.id_orden_pedido = op.id
      LEFT JOIN contenedores cont ON cont.id = oc.id_contenedor
      LEFT JOIN (${SQL_ULTIMO_MOV}) um ON um.id_contenedor = oc.id_contenedor
      WHERE op.tipo_op = 'C'
    `

    const actuales = db.prepare(`
      ${baseSelect}
        AND op.estado = 'entregado'
        AND um.estado_paso IN ('entregado','en_alquiler','a_retirar')
      ORDER BY fecha_fin_estimada ASC
    `).all()

    const porFinalizar = actuales.filter(a => a.dias_restantes != null && a.dias_restantes <= 1)

    const programados = db.prepare(`
      ${baseSelect}
        AND op.estado IN ('pendiente','despachado')
      ORDER BY op.fecha_entrega_planificada ASC NULLS LAST, op.created_at ASC
    `).all()

    return { actuales, porFinalizar, programados }
  },

  contarPorEstado() {
    return db.prepare(`
      SELECT estado, COUNT(*) AS total
      FROM op_encabezado
      WHERE tipo_op = 'C'
      GROUP BY estado
    `).all()
  },

  obtener(id) {
    const op = db.prepare(`
      SELECT op.*, cli.nombre AS cliente_nombre, cli.tel_whatsapp, cli.domicilio_ppal,
             u.nombre AS administrativo_nombre
      FROM op_encabezado op
      JOIN clientes cli ON cli.id = op.id_cliente
      JOIN users    u ON u.id = op.id_administrativo
      WHERE op.id = ? AND op.tipo_op = 'C'
    `).get(id)
    if (!op) return null

    op.detalle = db.prepare(`
      SELECT oc.*, cont.numero_contenedor, cont.estado_general
      FROM op_detalle_contenedor oc
      LEFT JOIN contenedores cont ON cont.id = oc.id_contenedor
      WHERE oc.id_orden_pedido = ?
      LIMIT 1
    `).get(id)

    if (op.detalle?.id_contenedor) {
      op.movimientos = db.prepare(`
        SELECT m.*, u.nombre AS chofer_nombre, f.patente AS camion_patente
        FROM movimiento_contenedor m
        LEFT JOIN users u ON u.id = m.id_chofer
        LEFT JOIN flota_vehiculos f ON f.id = m.id_camion
        WHERE m.id_contenedor = ? AND m.id_op_contenedor = ?
        ORDER BY m.fecha_movimiento ASC, m.rowid ASC
      `).all(op.detalle.id_contenedor, op.detalle.id)

      op.estadoContenedor = db.prepare(`
        SELECT estado_paso, fecha_movimiento FROM movimiento_contenedor
        WHERE id_contenedor = ?
        ORDER BY fecha_movimiento DESC, rowid DESC LIMIT 1
      `).get(op.detalle.id_contenedor)

      // Días desde que se entregó en domicilio (para esta OP)
      const movEntrega = db.prepare(`
        SELECT fecha_movimiento FROM movimiento_contenedor
        WHERE id_contenedor = ? AND id_op_contenedor = ? AND estado_paso = 'entregado'
        ORDER BY fecha_movimiento ASC LIMIT 1
      `).get(op.detalle.id_contenedor, op.detalle.id)
      op.diasEnDomicilio = movEntrega
        ? Math.floor((Date.now() - new Date(movEntrega.fecha_movimiento).getTime()) / 86400000)
        : null
    } else {
      op.movimientos     = []
      op.estadoContenedor = null
      op.diasEnDomicilio  = null
    }

    return op
  },

  crear({ id_cliente, id_administrativo, domicilio_entrega, zona_entrega, plazo_alquiler, precio_alquiler, id_contenedor, observaciones }) {
    const { nro } = db.prepare(`SELECT COALESCE(MAX(nro_op), 0) + 1 AS nro FROM op_encabezado`).get()
    const id_op = crypto.randomUUID()

    db.transaction(() => {
      db.prepare(`
        INSERT INTO op_encabezado (id, id_cliente, id_administrativo, tipo_op, nro_op, estado, observaciones)
        VALUES (?, ?, ?, 'C', ?, 'pendiente', ?)
      `).run(id_op, id_cliente, id_administrativo, nro, observaciones || '')

      db.prepare(`
        INSERT INTO op_detalle_contenedor
          (id, id_orden_pedido, id_contenedor, domicilio_entrega, zona_entrega, plazo_alquiler, precio_alquiler)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(), id_op,
        id_contenedor || null,
        domicilio_entrega, zona_entrega || '',
        parseInt(plazo_alquiler) || 5,
        parseFloat(precio_alquiler) || 0
      )
    })()

    return { id: id_op, nro_op: nro }
  },

  asignarContenedor(id_op, id_contenedor) {
    db.prepare(`
      UPDATE op_detalle_contenedor SET id_contenedor = ? WHERE id_orden_pedido = ?
    `).run(id_contenedor, id_op)
  },

  // OP → despachado + movimiento en_transito (salida de planta)
  despachar(id_op) {
    const oc = db.prepare(
      `SELECT id, id_contenedor FROM op_detalle_contenedor WHERE id_orden_pedido = ? LIMIT 1`
    ).get(id_op)
    if (!oc?.id_contenedor) throw new Error('No hay contenedor asignado a esta OP.')

    db.transaction(() => {
      db.prepare(
        `UPDATE op_encabezado SET estado = 'despachado' WHERE id = ? AND estado = 'pendiente'`
      ).run(id_op)
      db.prepare(`
        INSERT INTO movimiento_contenedor (id, id_contenedor, id_op_contenedor, estado_paso, observaciones)
        VALUES (?, ?, ?, 'en_transito', 'Salida a entregar')
      `).run(crypto.randomUUID(), oc.id_contenedor, oc.id)
    })()
  },

  // OP → entregado + movimiento entregado
  entregar(id_op) {
    const oc = db.prepare(
      `SELECT id, id_contenedor FROM op_detalle_contenedor WHERE id_orden_pedido = ? LIMIT 1`
    ).get(id_op)
    if (!oc?.id_contenedor) throw new Error('No hay contenedor asignado a esta OP.')

    db.transaction(() => {
      db.prepare(`
        UPDATE op_encabezado SET estado = 'entregado'
        WHERE id = ? AND estado IN ('pendiente','despachado')
      `).run(id_op)
      db.prepare(`
        INSERT INTO movimiento_contenedor (id, id_contenedor, id_op_contenedor, estado_paso, observaciones)
        VALUES (?, ?, ?, 'entregado', 'Entregado en domicilio')
      `).run(crypto.randomUUID(), oc.id_contenedor, oc.id)
    })()
  },

  // Registrar que el camión fue a buscar el contenedor
  registrarRetiro(id_op) {
    const oc = db.prepare(
      `SELECT id, id_contenedor FROM op_detalle_contenedor WHERE id_orden_pedido = ? LIMIT 1`
    ).get(id_op)
    if (!oc?.id_contenedor) throw new Error('No hay contenedor asignado.')
    db.prepare(`
      INSERT INTO movimiento_contenedor (id, id_contenedor, id_op_contenedor, estado_paso, observaciones)
      VALUES (?, ?, ?, 'en_transito', 'Retirado de domicilio')
    `).run(crypto.randomUUID(), oc.id_contenedor, oc.id)
  },

  // Contenedor llegó a planta — fin del ciclo
  devolverAPlanta(id_op) {
    const oc = db.prepare(
      `SELECT id, id_contenedor FROM op_detalle_contenedor WHERE id_orden_pedido = ? LIMIT 1`
    ).get(id_op)
    if (!oc?.id_contenedor) throw new Error('No hay contenedor asignado.')
    db.prepare(`
      INSERT INTO movimiento_contenedor (id, id_contenedor, id_op_contenedor, estado_paso, observaciones)
      VALUES (?, ?, ?, 'vaciado', 'Devuelto a planta')
    `).run(crypto.randomUUID(), oc.id_contenedor, oc.id)
  },

  anular(id_op) {
    db.prepare(`
      UPDATE op_encabezado SET estado = 'anulado'
      WHERE id = ? AND estado IN ('pendiente','despachado')
    `).run(id_op)
  },

  clientes() {
    return db.prepare(`SELECT id, nombre FROM clientes WHERE activo = 1 ORDER BY nombre`).all()
  },

  contenedoresDisponibles() {
    return db.prepare(`
      SELECT c.id, c.numero_contenedor
      FROM contenedores c
      JOIN (${SQL_ULTIMO_MOV}) um ON um.id_contenedor = c.id
      WHERE c.activo = 1 AND c.estado_general = 'operativo'
        AND um.estado_paso IN ('en_planta','vaciado')
      ORDER BY c.numero_contenedor
    `).all()
  },
}

module.exports = AlquileresModel
