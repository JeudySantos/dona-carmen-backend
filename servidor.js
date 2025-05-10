const Database = require('better-sqlite3');

// Conectamos a la base de datos (creará el archivo si no existe)
const db = new Database('pedidos.db');

// Crear tabla si no existe
db.prepare(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT,
        customerName TEXT,
        customerPhone TEXT,
        customerAddress TEXT,
        customerZone TEXT,
        customerNotes TEXT,
        items TEXT, -- guardaremos los productos como texto JSON
        subtotal REAL,
        shipping REAL,
        total REAL
    )
`).run();

// servidor.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Permitir recibir datos JSON
app.use(cors()); 
app.use(express.json());

app.post('/api/pedidos', (req, res) => {
    const pedido = req.body;
	console.log('Pedido recibido:', pedido);  // <<--- Esta línea muestra el pedido en cmd

    // Guardar pedido en base de datos
    const stmt = db.prepare(`
        INSERT INTO pedidos (orderNumber, customerName, customerPhone, customerAddress, customerZone, customerNotes, items, subtotal, shipping, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        pedido.orderNumber,
        pedido.customer.name,
        pedido.customer.phone,
        pedido.customer.address,
        pedido.customer.zone,
        pedido.customer.notes,
        JSON.stringify(pedido.items), // convertimos el carrito a texto para guardarlo
        pedido.subtotal,
        pedido.shipping,
        pedido.total
    );

    res.status(201).json({ mensaje: 'Pedido recibido y guardado en base de datos', pedido });
});


// Ruta para consultar un pedido
app.get('/api/pedidos/:id', (req, res) => {
    const id = req.params.id;

    const stmt = db.prepare(`SELECT * FROM pedidos WHERE orderNumber = ?`);
    const pedido = stmt.get(id);

    if (pedido) {
        pedido.items = JSON.parse(pedido.items); // Convertimos de texto JSON a objeto
        res.json(pedido);
    } else {
        res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
});


// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
