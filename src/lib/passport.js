import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import pool from "../database.js";
import helpers from "../lib/helpers.js";

// =========================
// LOGIN
// =========================

passport.use(
    "local.signincli",
    new LocalStrategy(
        {
            usernameField: "usuario",
            passwordField: "password",
            passReqToCallback: true,
        },
        async (req, usuario, password, done) => {
            try {
                console.log("➡️ Iniciando login de usuario:", usuario);

                const rows = await pool.query(
                    "SELECT * FROM usuarios WHERE usuario = ?",
                    [usuario]
                );

                console.log("📌 Resultado DB:", rows);

                if (rows.length === 0) {
                    console.log("❌ Usuario no existe");

                    return done(null, false, {
                        message: "Usuario o contraseña incorrectos",
                    });
                }

                const user = rows[0];

                const validPassword = await helpers.matchPassword(
                    password,
                    user.password
                );

                if (!validPassword) {
                    console.log("❌ Contraseña incorrecta");

                    return done(null, false, {
                        message: "Usuario o contraseña incorrectos",
                    });
                }

                console.log("✅ Login correcto:", user.usuario);

                return done(null, user);
            } catch (error) {
                console.error("🔥 ERROR en local.signincli:", error);

                return done(error);
            }
        }
    )
);

// =========================
// REGISTRO
// =========================

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
                let { nombre, nivel } = req.body;

                if (nivel === undefined) {
                    nivel = 100;
                }

                // Verificar si existe
                const verif = await pool.query(
                    "SELECT * FROM usuarios WHERE usuario = ?",
                    [usuario]
                );

                if (verif.length > 0) {
                    console.log("❌ Usuario existente");

                    return done(null, false, {
                        message: "El usuario ya existe",
                    });
                }

                // Encriptar contraseña
                const encryptedPassword =
                    await helpers.encryptPassword(password);

                // Insertar usuario
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

                // Crear objeto usuario
                const newUser = {
                    id: result.insertId,
                    usuario,
                    nombre,
                    nivel,
                };

                console.log("✅ Usuario creado:", newUser.usuario);

                return done(null, newUser);
            } catch (error) {
                console.error("🔥 ERROR en local.signupcl:", error);

                return done(error);
            }
        }
    )
);