import express from 'express';
import { deleteAllProductosPorId, deleteProductoDelCarritoPorId, crearCarrito, cargarCarrito, searchCartsPorId, searchUserPorId, searchProductsPorId } from '../funciones.js'; // Ajusta la ruta según la ubicación de tu archivo de funciones

const router = express.Router();

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // Si el usuario está autenticado, continuar con la siguiente función de middleware
    }
    res.redirect('/log'); // Si el usuario no está autenticado, redirigir al login
  };

// Ruta para borrar todos los productos de un carrito
router.delete('/:id', async (req, res) => {
    try {
        const idCarrito = parseInt(req.params.id, 10);
        await deleteAllProductosPorId(idCarrito);
        res.status(200).send(`Todos los productos del carrito con id ${idCarrito} han sido eliminados.`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

// Ruta para borrar un producto del carrito por ID
router.delete('/:idCarrito/productos/:idProducto', async (req, res) => {
    try {
        const idC = parseInt(req.params.idCarrito, 10);
        const idP = parseInt(req.params.idProducto, 10);
        await deleteProductoDelCarritoPorId(idC, idP);
        res.status(200).send(`Producto con id ${idP} eliminado del carrito con id ${idC}.`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

// Ruta para crear un nuevo carrito
router.post('/', async (req, res) => {
    try {
        const nuevoCarritoId = await crearCarrito();
        res.status(201).json({ id: nuevoCarritoId });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

// Ruta para agregar un producto al carrito
router.post("/:idCarrito/productos/:idProducto", async (req, res) => {
    try {
        const idCarrito = parseInt(req.params.idCarrito, 10);
        const idProducto = parseInt(req.params.idProducto, 10);
        await cargarCarrito(idCarrito, idProducto);
        res.status(200).send(`Producto con id ${idProducto} agregado al carrito con id ${idCarrito}.`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

// Ruta para mostrar un carrito
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.session.passport.user;
        const marca = req.query.marca || ''; // Marca para filtrar, si no se proporciona, será una cadena vacía
        const orden = req.query.orden || 'asc'; // Orden por precio, si no se proporciona, será ascendente
        const id = req.params.id;
        const carrito = await searchCartsPorId(id);
        if (!carrito) {
            return res.status(404).send("Carrito no encontrado");
        }
        const productosEnCarrito = [];
        for (const idProducto of carrito.ids) {
            const producto = await searchProductsPorId(idProducto, marca, orden);
            if (producto) {
                productosEnCarrito.push(producto[0]);
            }
        }
        let user; // Declaración de la variable user fuera del bloque if

        if (userId != 1) {
            user = await searchUserPorId(userId);
        } else {
            user = admin;
        }
        console.log(productosEnCarrito)
        res.render("cart", { title: "Carrito de Compras", carrito: productosEnCarrito, marca: marca, orden: orden, user: user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

export default router;