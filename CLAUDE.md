# CLAUDE.md — Contexto completo del proyecto
> Este archivo es para uso de Claude Code (VS Code / terminal).
> Contiene todo el contexto necesario para trabajar en el proyecto sin conversación previa.

---

## 🏢 Sobre el proyecto

**Cliente:** Suelosur S.A.S. — Sr. Eduardo Mezzavilla — Córdoba, Argentina  
**Proveedor:** VM Software Solutions — Valentino Mezzavilla (Ingeniero en Software)  
**Proyecto:** Sistema de Gestión Integral a medida para Suelosur S.A.S.  
**Estado actual:** Sprint 0 completado — base del proyecto funcionando

---

## 🏗️ Negocio de Suelosur

Suelosur tiene **tres líneas de negocio**:

1. **Venta de áridos** — Arena fina, arena gruesa, piedra partida, piedra bola, canto rodado, tosca. Se despacha en camiones propios.
2. **Alquiler de contenedores** — 75 contenedores de obra. Se entregan en domicilios de clientes por 3-5 días, luego se retiran, vacían y reasignan.
3. **Alquiler de máquina Bobcat** — Servicio de movimiento de suelo por horas con operario.

**Flota:** 5 camiones + 1 Bobcat  
**Roles de usuario:** admin_ventas, admin_contable, chofer, dueno

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Vistas | EJS + express-ejs-layouts |
| CSS | Bootstrap 5 + custom (public/css/main.css) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth + express-session |
| ORM/Query | @supabase/supabase-js (SDK oficial) |
| Deploy | Railway (backend) |
| Facturación | afip.js (ARCA/AFIP) — Sprint 6 |
| WhatsApp | Twilio API — Sprint 3 |

---

## 📁 Estructura de carpetas

```
suelosur/
├── server.js                    ← entry point: require('./src/app'), listen en PORT
├── src/
│   ├── app.js                   ← Express config, middlewares, rutas, 404
│   ├── config/
│   │   └── supabase.js          ← createClient singleton con service_role key
│   ├── middlewares/
│   │   ├── auth.js              ← verifica req.session.user, redirige a /auth/login
│   │   └── roles.js             ← (...rolesPermitidos) => middleware de rol
│   ├── routes/
│   │   ├── auth.routes.js       ← GET/POST /auth/login, GET /auth/logout
│   │   ├── ventas.routes.js     ← (Sprint 1)
│   │   ├── contenedores.routes.js ← (Sprint 2)
│   │   ├── stock.routes.js      ← (Sprint 1)
│   │   ├── clientes.routes.js   ← (Sprint 0 — CRUD)
│   │   ├── cobranzas.routes.js  ← (Sprint 4)
│   │   ├── compras.routes.js    ← (Sprint 5)
│   │   ├── flota.routes.js      ← (Sprint 6)
│   │   ├── facturacion.routes.js ← (Sprint 6)
│   │   └── dashboard.routes.js  ← (Sprint 7)
│   ├── controllers/             ← lógica de negocio, un archivo por módulo
│   └── services/                ← queries a Supabase, un archivo por módulo
├── views/
│   ├── layouts/
│   │   ├── main.ejs             ← layout base: sidebar + navbar + alerts + body
│   │   └── auth.ejs             ← layout login sin sidebar
│   ├── partials/
│   │   ├── sidebar.ejs          ← menú lateral dinámico por rol
│   │   ├── navbar.ejs           ← header con título y nombre de usuario
│   │   └── alerts.ejs           ← flash messages success/error/warning
│   └── pages/
│       ├── auth/login.ejs
│       ├── dashboard.ejs
│       ├── placeholder.ejs      ← módulos aún no desarrollados
│       ├── error.ejs
│       ├── clientes/            ← (Sprint 0)
│       ├── ventas/              ← (Sprint 1)
│       ├── contenedores/        ← (Sprint 2)
│       ├── stock/               ← (Sprint 1)
│       ├── cobranzas/           ← (Sprint 4)
│       ├── compras/             ← (Sprint 5)
│       ├── flota/               ← (Sprint 6)
│       └── dashboard/           ← (Sprint 7)
├── public/
│   ├── css/main.css             ← estilos custom + variables CSS
│   └── js/main.js               ← auto-close alerts a los 4 segundos
├── schema.sql                   ← SQL para ejecutar en Supabase SQL Editor
├── .env                         ← NUNCA commitear
├── .env.example
└── package.json
```

---

## 🔐 Variables de entorno (.env)

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=service-role-key       ← NUNCA exponer en cliente
SESSION_SECRET=cadena-larga-random
PORT=3000
NODE_ENV=development
# Sprint 6:
AFIP_CUIT=
AFIP_CERT=
AFIP_KEY=
# Sprint 4:
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_WHATSAPP_FROM=
```

---

## 🗄️ Base de datos — Tablas Supabase

### Tablas existentes (Sprint 0)
```sql
user_profiles   id, user_id (FK auth.users), nombre, rol, activo, created_at
clientes        id, nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente, activo, created_at
productos       id, nombre, unidad_medida, precio_referencia, activo, created_at
```

### Tablas Sprint 1 (Ventas + Stock)
```sql
op_encabezado       id, id_cliente (FK), id_administrativo (FK user_profiles), fecha_emision,
                    tipo_op (M/C/B), nro_op, estado (pendiente/despachado/entregado/anulado)

op_detalle_material id, id_orden_pedido (FK), id_producto (FK),
                    cantidad_pedida (DECIMAL), precio_unitario (DECIMAL)

stock               id, id_producto (FK), cantidad_actual (DECIMAL),
                    cant_pendiente_entregar (DECIMAL), stock_minimo (DECIMAL)

flota_vehiculos     id, tipo_vehiculo, patente, nombre, kilometraje, activo
```

### Tablas Sprint 2 (Contenedores)
```sql
contenedores            id, numero_contenedor (INT UNIQUE), estado_general,
                        fecha_ultima_pintada

op_detalle_contenedor   id, id_orden_pedido (FK), id_contenedor (FK puede ser NULL al inicio),
                        domicilio_entrega, zona_entrega, plazo_alquiler (INT días)

movimiento_contenedor   id, id_contenedor (FK), id_op_contenedor (FK),
                        id_chofer (FK user_profiles), id_camion (FK flota_vehiculos),
                        fecha_movimiento, estado_paso (entregado/en_alquiler/a_retirar/
                        en_transito/vaciado/en_planta)
```

### Tablas Sprint 3 (Hoja de ruta)
```sql
remision    id, id_orden_pedido (FK), id_chofer (FK), id_camion (FK),
            fecha_entrega, hora_entrega
```

### Tablas Sprint 4 (Cobranzas)
```sql
cuenta_corriente    id, id_cliente (FK), tipo_movimiento (R/F/P),
                    nro_comprobante, monto_debito (DECIMAL), monto_credito (DECIMAL),
                    saldo_resultante (DECIMAL), fecha_vencimiento, created_at

cobros_pagos        id, id_mov_cc (FK), tipo_instrumento (efectivo/cheque/echeq/transferencia),
                    monto (DECIMAL), fecha, observaciones
```

### Tablas Sprint 5 (Compras)
```sql
proveedores             id, nombre, cuit, domicilio, tel, email, activo
compras_encabezado      id, id_proveedor (FK), fecha, estado (emitida/recibida/cancelada)
compras_detalle         id, id_compra (FK), id_producto (FK), cantidad, precio_unitario
cc_proveedores          id, id_proveedor (FK), tipo_movimiento, monto_debito,
                        monto_credito, saldo_resultante, fecha
```

### Tablas Sprint 6 (Flota + Facturación)
```sql
mantenimiento_vehiculo  id, id_vehiculo (FK), tipo_service, fecha, costo, km,
                        proxima_fecha, taller, observaciones
combustible             id, id_vehiculo (FK), litros, costo_total, km_al_cargar,
                        fecha, id_chofer (FK)
facturas                id, id_remito (FK), id_cliente (FK), tipo_comprobante (A/B),
                        punto_venta, nro_factura, cae, fecha_vencimiento_cae,
                        monto_total, fecha_emision
```

> **RLS:** Todas las tablas tienen RLS activado con política `USING (false)` para bloquear acceso desde anon key. El servidor usa `service_role` key que bypasea RLS.

---

## 👥 Roles de usuario

| Rol | Acceso |
|-----|--------|
| `admin_ventas` | /ventas, /contenedores, /stock, /clientes, /compras, /logistica |
| `admin_contable` | /cobranzas, /facturacion, /proveedores, /caja |
| `chofer` | /hoja-de-ruta, /movimientos (solo los propios), /combustible |
| `dueno` | Todo + /dashboard, /estadisticas, /flota, /reportes |

### Cómo usar los middlewares
```js
const auth  = require('../middlewares/auth')
const roles = require('../middlewares/roles')

// Solo autenticado:
router.get('/algo', auth, controller)

// Con rol específico:
router.get('/dashboard', auth, roles('dueno'), controller)

// Múltiples roles:
router.get('/ventas', auth, roles('admin_ventas', 'dueno'), controller)
```

---

## 🎨 Paleta de colores y estilos

La paleta es **naranja y gris oscuro** (usada en PDFs de propuesta):
```css
--dark:      #1c1c1e   /* fondo oscuro */
--accent:    #2a2a2e   /* gris oscuro */
--highlight: #ff6b35   /* naranja principal */
--mid:       #3d3d42   /* gris medio */
```

En el sistema web se usa Bootstrap 5 con clases custom definidas en `public/css/main.css`:
- `.btn-naranja` — botón naranja principal
- `.sidebar-link.active` — ítem activo del sidebar
- `.badge-pendiente / .badge-activo / .badge-alerta / .badge-en-transito` — estados
- `.dias-ok / .dias-alerta / .dias-rojo` — semáforo de días para contenedores

---

## 📋 Convenciones de código

### Rutas
```js
// Patrón estándar de una ruta
router.get('/', auth, roles('admin_ventas','dueno'), async (req, res) => {
  try {
    const datos = await MiServicio.listar()
    res.render('pages/modulo/index', {
      titulo: 'Nombre del módulo',
      datos,
    })
  } catch (err) {
    console.error(err)
    req.flash('error', 'Ocurrió un error al cargar los datos.')
    res.redirect('back')
  }
})
```

### Servicios (queries Supabase)
```js
const supabase = require('../config/supabase')

const MiServicio = {
  async listar() {
    const { data, error } = await supabase
      .from('mi_tabla')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async crear(payload) {
    const { data, error } = await supabase
      .from('mi_tabla')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
module.exports = MiServicio
```

### Vistas EJS
```html
<!-- Siempre disponibles en todas las vistas via res.locals: -->
<!-- user.id, user.nombre, user.rol, user.email -->
<!-- success[], error[], warning[] (flash messages) -->

<!-- Patrón de tabla estándar -->
<table class="table table-hover align-middle">
  <thead>
    <tr>
      <th>Columna</th>
    </tr>
  </thead>
  <tbody>
    <% datos.forEach(item => { %>
      <tr>
        <td><%= item.campo %></td>
      </tr>
    <% }) %>
  </tbody>
</table>

<!-- Patrón de formulario -->
<form action="/ruta" method="POST">
  <div class="mb-3">
    <label class="form-label">Campo</label>
    <input type="text" name="campo" class="form-control" required>
  </div>
  <button type="submit" class="btn btn-naranja">Guardar</button>
</form>

<!-- PUT/DELETE desde formulario (method-override) -->
<form action="/ruta/<%= item.id %>?_method=PUT" method="POST">
```

### Flash messages
```js
req.flash('success', 'Operación realizada correctamente.')
req.flash('error', 'Ocurrió un error.')
req.flash('warning', 'Atención: revisar datos.')
res.redirect('/ruta')
```

---

## 🔄 Plan de Sprints

| Sprint | Módulos | Semanas | Estado |
|--------|---------|---------|--------|
| 0 | Auth + Layout + Clientes + Productos | 1-2 | ✅ Completado |
| 1 | Ventas (OP) + Stock + Remitos | 3-4 | 🔜 Siguiente |
| 2 | Contenedores + Circuito diario | 5-6 | ⏳ Pendiente |
| 3 | Hoja de ruta choferes | 7-8 | ⏳ Pendiente |
| 4 | Cobranzas + Cuentas Corrientes + WhatsApp | 9-10 | ⏳ Pendiente |
| 5 | Compras + Proveedores | 11-12 | ⏳ Pendiente |
| 6 | Flota + Mantenimiento + Facturación ARCA | 13-14 | ⏳ Pendiente |
| 7 | Dashboard KPIs + QA + Deploy | 15-16 | ⏳ Pendiente |

---

## ⚠️ Reglas críticas de negocio

### Stock
- `stock.cant_pendiente_entregar` = suma de cantidades en OPs con estado `pendiente`
- Al crear OP tipo M → sumar cantidad a `cant_pendiente_entregar`
- Al confirmar entrega → restar de `cantidad_actual` Y de `cant_pendiente_entregar`
- Al anular OP → restar solo de `cant_pendiente_entregar`
- **Disponible real = cantidad_actual - cant_pendiente_entregar** — siempre mostrar este valor

### Contenedores
- El estado actual de un contenedor = `estado_paso` del **último** `movimiento_contenedor`
- **NUNCA actualizar** filas existentes de movimientos — siempre insertar una nueva fila
- Días en domicilio = `EXTRACT(DAY FROM NOW() - fecha del movimiento con estado 'entregado')`
- Circuito diario = contenedores donde días >= plazo_alquiler, agrupados por zona

### Cuenta Corriente
- `saldo_resultante` = saldo anterior + monto_debito - monto_credito
- Calcularlo en el controller al insertar, no con triggers
- Al emitir remito → insertar movimiento con monto_debito
- Al registrar cobro → insertar movimiento con monto_credito
- Saldo actual del cliente = saldo_resultante del último movimiento

### Seguridad
- `SUPABASE_KEY` (service_role) solo en servidor — nunca en cliente
- Siempre validar inputs en el controller antes de llamar al servicio
- `method-override` habilitado: usar `?_method=PUT` y `?_method=DELETE` en forms

---

## 🚀 Comandos útiles

```bash
# Desarrollo
npm run dev          # nodemon server.js

# Producción
npm start            # node server.js

# Instalar dependencias si se clona el repo
npm install
```

---

## 📦 Dependencies (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "bcryptjs": "^2.4.3",
    "connect-flash": "^0.1.1",
    "dotenv": "^16.3.1",
    "ejs": "^3.1.9",
    "express": "^4.18.2",
    "express-ejs-layouts": "^2.5.1",
    "express-session": "^1.17.3",
    "method-override": "^3.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 💡 Contexto adicional para Claude Code

- **Valentino Mezzavilla** es el único desarrollador del proyecto (freelancer individual).
- El proyecto se desarrolla con metodología **Scrum** — un sprint a la vez.
- El **Sprint actual es el 1**: hay que construir Ventas (OP) + Stock + Remitos.
- Cuando se pide agregar un módulo, seguir siempre el patrón: `route → controller → service → view`.
- Las vistas EJS usan `express-ejs-layouts` — **no repetir** el HTML base en cada vista.
- Los layouts disponibles son `layouts/main` (con sidebar) y `layouts/auth` (sin sidebar).
- `res.locals.user` y los flash messages están disponibles en **todas** las vistas automáticamente.
- Bootstrap 5 está disponible via CDN en el layout — no instalar localmente.
- Chart.js está disponible via CDN para gráficos en el dashboard.
- Para paginación usar `LIMIT` y `OFFSET` en las queries de Supabase desde el inicio.
- Para formularios con listas largas de clientes/productos usar `<datalist>` o autocomplete simple con JS vanilla.

---

*Última actualización: Sprint 0 completado — Mayo 2025*
*Desarrollador: Valentino Mezzavilla — VM Software Solutions*
