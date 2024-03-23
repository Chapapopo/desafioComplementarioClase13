import express from 'express';
import { searchUserPorId } from '../funciones.js'; // Importa las funciones necesarias

const router = express.Router();

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // Si el usuario está autenticado, continuar con la siguiente función de middleware
    }
    res.redirect('/log'); // Si el usuario no está autenticado, redirigir al login
  };

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    let user; // Declaración de la variable user fuera del bloque if

    if (userId != 1) {
      user = await searchUserPorId(userId);
    } else {
      user = admin;
    }

    console.log(user)

    res.render("current", { title: "Usuario actual",user: user }); // Renderiza la plantilla con los productos, la información de paginación, la marca y la orden para mostrarla en la plantilla
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

export default router;