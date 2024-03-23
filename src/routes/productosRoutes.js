import express from 'express';
import { searchProductsPorId2, searchUserPorId } from '../funciones.js'; // Importa las funciones necesarias

const router = express.Router();

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // Si el usuario está autenticado, continuar con la siguiente función de middleware
    }
    res.redirect('/log'); // Si el usuario no está autenticado, redirigir al login
  };

// Ruta para ver un solo producto
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const idProducto = parseInt(req.params.id, 10);
    const producto = await searchProductsPorId2(idProducto);
    console.log(producto)

    if (!producto) {
      res.status(404).send(`No se encontró un producto con id ${idProducto}.`);
      return;
    }
    let user; // Declaración de la variable user fuera del bloque if

    if (userId != 1) {
      user = await searchUserPorId(userId);
    } else {
      user = admin; // Asegúrate de tener definida la variable admin en tu código
    }
    res.render("producto", { title: 'Producto', producto: producto, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

// Ruta para borrar un producto por ID
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).send("Producto no encontrado");
    }
    res.status(200).send("Producto eliminado correctamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

export default router;