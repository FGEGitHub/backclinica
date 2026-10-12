import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import pool from "../database.js";
import helpers from "../lib/helpers.js";

// =====================================================
// LOGIN
// =====================================================
passport.use(
    "local.signincli",
    new LocalStrategy(
        {
            usernameField: "usuario",
            passwordField: "password",
        },
        async (usuario, password, done) => {
            try {
                // Buscar usuario en la base de datos
                const [rows] = await pool.query(
                    "SELECT * FROM usuarios WHERE usuario = ?",
                    [usuario]
                );

                // Verificar si el usuario existe
                if (rows.length === 0) {
                    return done(null, false, {
                        message: "Usuario o contraseña incorrectos",
                    });
                }

                const user = rows[0];

                // Verificar contraseña
                const validPassword = await helpers.matchPassword(
                    password,
                    user.password
                );

                if (!validPassword) {
                    return done(null, false, {
                        message: "Usuario o contraseña incorrectos",
                    });
                }

                // Obtener el ID de la clínica del usuario
                const id_clinica = user.id_clinica;

                // VALIDACIÓN PERSONALIZADA:
                // Acá definís qué condición debe cumplir id_clinica.
                // Si la validación falla, podés usar:
                // return done(null, false, { message: "Validación fallida" });

                // Si la validación es exitosa, continúa el login.

                // Login exitoso
                return done(null, user);

            } catch (error) {
                console.error("Error en local.signincli:", error);

                return done(error);
            }
        }
    )
);


// =====================================================
// REGISTRO DE USUARIOS
// =====================================================
passport.use(
    "local.signupcl",
    new LocalStrategy(
        {
            usernameField: "usuario",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, usuario, password, done) => {
            try {
                
                // Obtener datos adicionales del formulario
                let { nombre, nivel } = req.body;

                // Nivel predeterminado
                if (nivel === undefined) {
                    nivel = 1;
                }

                // Verificar si el usuario ya existe
                const verif = await pool.query(
                    "SELECT * FROM usuarios WHERE usuario = ?",
                    [usuario]
                );

                if (verif.length > 0) {
                    return done(null, false, {
                        message: "El usuario ya existe",
                    });
                }

                // Encriptar contraseña antes de almacenarla
                const encryptedPassword =
                    await helpers.encryptPassword(password);

                // Insertar usuario en la base de datos
                const result = await pool.query(
                    `INSERT INTO usuarios
                    SET password = ?, usuario = ?, nombre = ?, nivel = ?`,
                    [
                        encryptedPassword,
                        usuario,
                        nombre,
                        nivel,
                    ]
                );

                // Crear objeto con los datos del nuevo usuario
                // No se incluye la contraseña
                const newUser = {
                    id: result.insertId,
                    usuario,
                    nombre,
                    nivel,
                };

                // Registro exitoso
                return done(null, newUser);

            } catch (error) {
                console.error("Error en local.signupcl:", error);

                return done(error);
            }
        }
    )
);