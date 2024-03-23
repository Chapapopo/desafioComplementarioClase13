import express from "express";
import { engine } from "express-handlebars";
import { __dirname } from "./utils.js";
import * as path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import "./connection.js";
import Carts from './dao/model/cart.model.js'; // Importa el modelo Cart
import Users from './dao/model/user.model.js'; // Importa el modelo User
import bcrypt from 'bcryptjs';
import passport from "passport";
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
//funciones
import { searchProducts, searchProductsPorId, searchProductsPorId2, searchCartsPorId, crearCarrito, deleteProductoDelCarritoPorId, modificarProductoPorId, modificarCarritoPorId, cargarCarrito, deleteAllProductosPorId, searchUserPorId, userValidation } from './funciones.js'; // Importa las funciones
//rutas
import productosRoutes from './routes/productosRoutes.js'; // Importa las rutas de productos
import cartRoutes from './routes/cartRoutes.js';
import currentRoutes from './routes/currentRoutes.js'; // Importa las rutas de productos


const GITHUB_CLIENT_ID = 'f9d64b4d44b659c69bdd';
const GITHUB_CLIENT_SECRET = '695b52effddebe0be38b95e3d495eeb258e26230';

//Configuraciones

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('tu_secreto')); //
app.use(session({
  secret: 'tu_secreto', // Cambia esto por una cadena de caracteres segura
  resave: true, //
  saveUninitialized: true
}));

app.use(passport.initialize());//
app.use(passport.session());//

app.listen(PORT, () => { console.log(`Server run Express port: ${PORT}`); });

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname + "/views"));
app.use("/", express.static(__dirname + "/public"));

const admin = {
  name: 'Admin',
  lastName: 'Admin',
  email: 'adminCoder@coder.com',
  rol: 'admin'
};

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
}, async (email, password, done) => {
  try {
    // Verificar si las credenciales corresponden al administrador
    if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
      const admin = {
        _id: 1,
        name: 'Admin',
        lastName: 'Admin',
        email: 'adminCoder@coder.com',
        rol: 'admin'
      };
      return done(null, admin);
    }

    // Buscar al usuario en la base de datos por su correo electrónico
    const usuario = await Users.findOne({ email });

    if (!usuario) {
      // Si el usuario no existe, devolver un error
      return done(null, false, { message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña del usuario utilizando bcrypt
    const isPasswordValid = await bcrypt.compare(password, usuario.password);

    if (isPasswordValid) {
      // Si la contraseña es válida, devolver el usuario
      return done(null, usuario);
    } else {
      // Si la contraseña no es válida, devolver un mensaje de error
      return done(null, false, { message: 'Contraseña incorrecta' });
    }
  } catch (error) {
    // Si ocurre un error, devolver el error
    return done(error);
  }
}));

passport.serializeUser((usuario, done) => {
  // Serializa el usuario para almacenarlo en la sesión
  done(null, usuario._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    if (id === 1) {
      // Si el ID es 1, devolver el usuario administrador
      const admin = {
        _id: 1,
        name: 'Admin',
        lastName: 'Admin',
        email: 'adminCoder@coder.com',
        rol: 'admin'
      };
      return done(null, admin);
    }

    // De lo contrario, buscar al usuario en la base de datos
    const usuario = await Users.findById(id);
    done(null, usuario);
  } catch (error) {
    done(error);
  }
});


// Middleware de Passport para inicializar y manejar las sesiones
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:8080/auth/github/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    // Aquí puedes manejar la autenticación de usuario
    console.log(profile._json.email)
    const email = profile._json.email;

    // Buscar al usuario en la base de datos por su correo electrónico
    const usuario = await Users.findOne({ email });

    console.log(usuario)

    if (!usuario) {
      // Si el usuario no existe, devolver un error
      return done(null, false, { message: 'Usuario no encontrado' });
    }

    return done(null, usuario);
  }
));

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // Si el usuario está autenticado, continuar con la siguiente función de middleware
  }
  res.redirect('/log'); // Si el usuario no está autenticado, redirigir al login
};


// Ruta inicial para iniciar la autenticación con GitHub
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// Ruta de callback para GitHub
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/log' }),
  function (req, res) {
    // Autenticación exitosa, redirige a la página principal o a donde lo necesites
    res.redirect('/');
  }
);


app.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.passport.user;
    const page = parseInt(req.query.page) || 1; // Página actual, si no se proporciona, será la primera página
    const limit = parseInt(req.query.limit) || 10; // Cantidad de productos por página, por defecto 10
    const marca = req.query.marca || ''; // Marca para filtrar, si no se proporciona, será una cadena vacía
    const orden = req.query.orden || 'asc'; // Orden por precio, si no se proporciona, será ascendente
    const result = await searchProducts(page, limit, marca, orden);
    let user; // Declaración de la variable user fuera del bloque if

    if (userId != 1) {
      user = await searchUserPorId(userId);
    } else {
      user = admin;
    }

    console.log(user)

    res.render("home", { title: "Home handelbars", productos: result.productos, pagination: result.pagination, marca: marca, orden: orden, user: user }); // Renderiza la plantilla con los productos, la información de paginación, la marca y la orden para mostrarla en la plantilla
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

// Ruta para registrar un usuario
app.get("/log", (req, res) => {
  res.render("log", { title: "log" });
});

// Ruta para registrar un usuario
app.post("/register", async (req, res, next) => {
  try {
    const { name, lastName, email, password, age } = req.body;

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);
    const cart = await crearCarrito();

    // Crear un nuevo usuario
    const nuevoUsuario = new Users({
      name,
      lastName,
      email,
      age,
      cart,
      password: hashedPassword // Usar el password hasheado
    });

    // Guardar el usuario en la base de datos
    await nuevoUsuario.save();

    // Autenticar al usuario recién registrado
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/log',
    })(req, res, next);
  } catch (error) {
    console.error("Error al crear el usuario:", error.message);
    res.redirect("/log");
  }
});

// Ruta para iniciar sesión
app.post("/login", passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/log',
}));

// Ruta para cerrar sesión
app.post("/logout", (req, res) => {
  // Destruye la sesión, eliminando el usuario de la sesión
  req.session.destroy();
  res.send("Sesión cerrada correctamente");
});

// Middleware para usar las rutas
app.use('/productos', productosRoutes);
app.use('/carts', cartRoutes);
app.use('/current', currentRoutes);

//Rutas

app.put('/api/carts/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { cantidad } = req.body;

    // Validar que la cantidad sea un número positivo
    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número positivo.' });
    }

    // Obtener el carrito por su id
    let carrito = await Carts.findOne({ id: cid });
    if (!carrito) {
      return res.status(404).json({ error: `No se encontró un carrito con id ${cid}.` });
    }

    // Verificar si el producto está en el carrito
    const productoEnCarrito = carrito.products.find(prod => prod.id === pid);
    if (!productoEnCarrito) {
      return res.status(404).json({ error: `El producto con id ${pid} no está en el carrito.` });
    }

    // Actualizar la cantidad del producto en el carrito
    productoEnCarrito.cantidad = cantidad;
    await carrito.save();

    return res.status(200).json({ message: `Cantidad del producto con id ${pid} actualizada en el carrito con id ${cid}.` });
  } catch (error) {
    console.error(`Error al actualizar la cantidad del producto en el carrito: ${error.message}`);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});