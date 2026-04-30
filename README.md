# Suelosur — Sistema de Gestión Integral

Desarrollado por **VM Software Solutions — Valentino Mezzavilla**

## Stack
- **Backend:** Node.js + Express
- **Vistas:** EJS + express-ejs-layouts
- **CSS:** Bootstrap 5 + custom
- **Base de datos:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + express-session

## Setup

### 1. Clonar e instalar
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 3. Ejecutar el schema en Supabase
Abrir `schema.sql` y ejecutarlo en el SQL Editor de Supabase.

### 4. Crear el primer usuario
1. Ir a Supabase → Authentication → Users → Invite user
2. Ingresar el email del dueño
3. Copiar el UUID generado
4. Ejecutar en SQL Editor:
```sql
INSERT INTO user_profiles (user_id, nombre, rol)
VALUES ('UUID-AQUI', 'Tu Nombre', 'dueno');
```

### 5. Levantar el servidor
```bash
npm run dev
```

Abrir http://localhost:3000

## Roles
| Rol | Acceso |
|-----|--------|
| `dueno` | Todo + Dashboard |
| `admin_ventas` | Ventas, Logística, Stock, Clientes |
| `admin_contable` | Cobranzas, Facturación, Contabilidad |
| `chofer` | Hoja de ruta (móvil) |

## Sprints
- **Sprint 0** ✅ Auth + Layout + Estructura base
- **Sprint 1** 🔜 Ventas + Stock
- **Sprint 2** 🔜 Contenedores
- **Sprint 3** 🔜 Cobranzas + CC
- **Sprint 4** 🔜 Compras + Proveedores
- **Sprint 5** 🔜 Flota + Mantenimiento
- **Sprint 6** 🔜 Facturación ARCA
- **Sprint 7** 🔜 Dashboard KPIs
