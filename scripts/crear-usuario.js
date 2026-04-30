require('dotenv').config()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const db = require('../src/config/db')

const usuario = process.argv[2] || 'valentino'
const password = process.argv[3] || 'suelosur123'
const nombre = process.argv[4] || 'Valentino'
const rol = process.argv[5] || 'dueno'

const hash = bcrypt.hashSync(password, 10)

const existe = db.prepare('SELECT id FROM users WHERE usuario = ?').get(usuario)

if (existe) {
  db.prepare('UPDATE users SET password_hash = ?, nombre = ?, rol = ?, activo = 1 WHERE usuario = ?')
    .run(hash, nombre, rol, usuario)
  console.log(`✅ Usuario "${usuario}" actualizado.`)
} else {
  db.prepare(
    `INSERT INTO users (id, usuario, password_hash, nombre, rol)
     VALUES (?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), usuario, hash, nombre, rol)
  console.log(`✅ Usuario "${usuario}" creado.`)
}

console.log(`   Usuario:  ${usuario}`)
console.log(`   Password: ${password}`)
console.log(`   Rol:      ${rol}`)
