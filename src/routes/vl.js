
import express from "express";
import dotenv from "dotenv";
const router = express.Router();
import cron from "node-cron";
import { } from "../lib/auth.js";
import pool from "../database.js";
import {
  isLoggedInncli,

} from "../lib/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import passport from "passport";
import jwt from "jsonwebtoken";

import {
    autenticarToken,
    obtenerHashToken
} from "../middlewares/autenticarToken.js";

/* 

router.get('/', async (req, res) => {

}) */



/* router.get('/clinicas', async (req, res) => {

///await pool.query

  res.json(
	[
 	  { 
                "id": 1, 
                "nombre": "Clínica Central", 
                "direccion": "Av. Rivadavia 4500", 
                "localidad": "CABA", 
               "telefono": "011-4901-2233" 
              }
          ]
);

}) */

router.get('/clinicas', async (req, res) => {
  try {
    const clinicas = await pool.query(`
      SELECT 
        id,
        nombre,
        direccion,
        localidad,
        telefono
      FROM clinicas
      ORDER BY nombre ASC
    `);

    res.json(clinicas);

  } catch (error) {
    console.error('Error al obtener las clínicas:', error);

    res.status(500).json({
      message: 'Error al obtener las clínicas',
      error: error.message
    });
  }
});


//////v1/clinicas/1/especialidades
router.get('/clinicas/:id/especialidades', async (req, res) => {
  const id_usuario = req.params.id;

  try {
    const especialidades = await pool.query(`
      SELECT DISTINCT
        e.id,
        e.nombre
      FROM especialidades e
      INNER JOIN trabajo t
        ON t.id_clinica COLLATE utf8mb4_general_ci =
           e.id_clinica COLLATE utf8mb4_general_ci
      WHERE t.id_usuario = ?
      ORDER BY e.nombre ASC
    `, [id_usuario]);

    res.json(especialidades);

  } catch (error) {
    console.error('Error al obtener las especialidades:', error);

    res.status(500).json({
      message: 'Error al obtener las especialidades',
      error: error.message
    });
  }
});


http://localhost:4000/vl/profesionales?clinicaId=2&especialidad=Dermatologia
/* router.get('/profesionales', async (req, res) => {
  try {
    const { clinicaId, especialidad } = req.query;

    if (!clinicaId || !especialidad) {
      return res.status(400).json({
        error: 'Los parámetros clinicaId y especialidad son obligatorios'
      });
    }

    const profesionales = await pool.query(
      `SELECT DISTINCT
          u.id,
          u.nombre,
          u.apellido,
          e.nombre AS especialidad
       FROM usuarios u
       INNER JOIN especializacion esp
          ON esp.id_medico = u.id
       INNER JOIN especialidades e
          ON e.id = esp.id_especialidad
       WHERE u.medico = 'Si'
         AND u.id_clinica = ?
         AND e.id_clinica = u.id_clinica
         AND e.nombre = ?`,
      [clinicaId, especialidad]
    );

    res.status(200).json(profesionales);

  } catch (error) {
    console.error('Error al obtener profesionales:', error);

    res.status(500).json({
      error: 'Error al obtener los profesionales'
    });
  }
}); */




////http://localhost:4000/vl/profesionales?clinicaId=2&especialidad=Cardiologia
router.get('/profesionales', autenticarToken, async (req, res) => {
  try {
    const { clinicaId, especialidad } = req.query;

    if (!clinicaId || !especialidad) {
      return res.status(400).json({
        error: 'Los parámetros clinicaId y especialidad son obligatorios'
      });
    }

    const profesionales = await pool.query(
      `
      SELECT DISTINCT
          u.id,
          u.nombre,
          u.apellido,
          e.nombre AS especialidad
      FROM trabajo t

      INNER JOIN usuarios u
          ON CAST(u.id AS CHAR) COLLATE utf8mb4_general_ci =
             CAST(t.id_usuario AS CHAR) COLLATE utf8mb4_general_ci

      INNER JOIN especializacion esp
          ON CAST(esp.id_medico AS CHAR) COLLATE utf8mb4_general_ci =
             CAST(u.id AS CHAR) COLLATE utf8mb4_general_ci

      INNER JOIN especialidades e
          ON CAST(e.id AS CHAR) COLLATE utf8mb4_general_ci =
             CAST(esp.id_especialidad AS CHAR) COLLATE utf8mb4_general_ci

      WHERE t.id_clinica = ?
        AND u.medico = 'Si'
        AND e.nombre COLLATE utf8mb4_general_ci =
            CONVERT(? USING utf8mb4) COLLATE utf8mb4_general_ci

      ORDER BY u.apellido ASC, u.nombre ASC
      `,
      [clinicaId, especialidad]
    );

    return res.status(200).json(profesionales);

  } catch (error) {
    console.error('Error al obtener profesionales:', error);

    return res.status(500).json({
      error: 'Error al obtener los profesionales'
    });
  }
});



////http://localhost:4000/vl/profesionales/2/fechas-disponibles?mes=2026-10 
router.get('/profesionales/:profesionalId/fechas-disponibles', async (req, res) => {
  try {
    const { profesionalId } = req.params;
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
      return res.status(400).json({
        error: 'El parámetro mes debe tener formato YYYY-MM'
      });
    }

    // Obtener los días de atención del profesional
    const horarios = await pool.query(
      `SELECT DISTINCT dia
       FROM horarios
       WHERE usuario_id = ?`,
      [profesionalId]
    );

    const diasLaborales = new Set(
      horarios.map(h => Number(h.dia))
    );

    const [anio, numeroMes] = mes.split('-').map(Number);
    const ultimoDia = new Date(anio, numeroMes, 0).getDate();

    const fechasDisponibles = [];

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const fecha = new Date(anio, numeroMes - 1, dia);

      // Lunes = 1, martes = 2, ..., domingo = 7
      const diaSemana = fecha.getDay() === 0
        ? 7
        : fecha.getDay();

      if (diasLaborales.has(diaSemana)) {
        fechasDisponibles.push(
          `${anio}-${String(numeroMes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        );
      }
    }

    return res.status(200).json({
      fechasDisponibles
    });

  } catch (error) {
    console.error('Error al obtener fechas disponibles:', error);

    return res.status(500).json({
      error: 'Error al obtener las fechas disponibles'
    });
  }
});




/////http://localhost:4000/vl/profesionales/1/horarios-disponibles?fecha=2026-10-05


router.get(
  '/profesionales/:profesionalId/horarios-disponibles',
  async (req, res) => {
    try {
      const { profesionalId } = req.params;
      const { fecha } = req.query;

      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({
          error: 'El parámetro fecha es obligatorio y debe tener formato YYYY-MM-DD'
        });
      }

      // Obtener día de la semana: lunes = 1, ..., domingo = 7
      const [anio, mes, dia] = fecha.split('-').map(Number);
      const fechaSeleccionada = new Date(anio, mes - 1, dia);

      const diaSemana = fechaSeleccionada.getDay() === 0
        ? 7
        : fechaSeleccionada.getDay();

      // Horarios de atención del profesional
      const horarios = await pool.query(
        `SELECT hora_inicio
         FROM horarios
         WHERE usuario_id = ?
           AND dia = ?
         ORDER BY hora_inicio`,
        [profesionalId, diaSemana]
      );

      // Turnos del profesional para la fecha seleccionada
      const turnos = await pool.query(
        `SELECT hora
         FROM turnos
         WHERE id_usuario = ?
           AND fecha = ?`,
        [profesionalId, fecha]
      );

      // Identificar las horas ocupadas
      const horariosOcupados = new Set(
        turnos.map(t => String(t.hora).slice(0, 5))
      );

      // Devolver horario y disponibilidad
      const horariosDisponibles = horarios.map(h => {
        const horario = String(h.hora_inicio).slice(0, 5);

        return {
          horario,
          disponible: !horariosOcupados.has(horario)
        };
      });

      return res.status(200).json(horariosDisponibles);

    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error);

      return res.status(500).json({
        error: 'Error al obtener los horarios disponibles'
      });
    }
  }
);




router.post('/turnos', async (req, res) => {
  try {
    const {
      clinicaId,
      profesionalId,
      fecha,
      horario,
      paciente
    } = req.body;

    // Validar datos obligatorios
    if (
      !clinicaId ||
      !profesionalId ||
      !fecha ||
      !horario ||
      !paciente?.nombre ||
      !paciente?.apellido ||
      !paciente?.dni
    ) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan datos obligatorios para reservar el turno'
      });
    }

    // Verificar si el horario ya está ocupado
    const turnosExistentes = await pool.query(
      `SELECT id
       FROM turnos
       WHERE id_usuario = ?
         AND fecha = ?
         AND hora = ?`,
      [profesionalId, fecha, horario]
    );

    if (turnosExistentes.length > 0) {
      return res.status(409).json({
        exito: false,
        mensaje: 'El horario seleccionado ya está ocupado'
      });
    }

    // Registrar el turno
    const resultado = await pool.query(
      `INSERT INTO turnos
        (id_usuario, fecha, hora)
       VALUES (?, ?, ?)`,
      [profesionalId, fecha, horario]
    );

    return res.status(201).json({
      exito: true,
      mensaje: 'Turno reservado exitosamente',
      idTurno: resultado.insertId,
      estado: 'CONFIRMADO',
      fechaCreacion: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al reservar turno:', error);

    return res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar el turno'
    });
  }
});



////////login

router.post(
    '/auth/login',

    passport.authenticate('local.signincli', {
        session: false
    }),

    async (req, res) => {
        try {
            const user = req.user;

            // Buscar la clínica asociada al usuario
            const rowsClinica = await pool.query(
                "SELECT * FROM clinicas WHERE id = ?",
                [user.id_clinica]
            );

            if (rowsClinica.length === 0) {
                return res.status(404).json({
                    message: 'No se encontró la clínica asociada al usuario'
                });
            }

            const clinica = rowsClinica[0];

            // Datos que contendrá el token
            const userForToken = {
                id: user.id,
                usuario: user.usuario,
                nivel: user.nivel,
                id_clinica: user.id_clinica
            };

            const token = jwt.sign(
                userForToken,
                process.env.JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );

            // Respuesta del login
            return res.json({
                user: {
                    id: user.id,
                    username: user.usuario,
                    firstName: user.nombre,
                    lastName: user.apellido,
                    role: user.rol ?? user.nivel,
                    professionalId: user.id_profesional ?? null
                },

                clinicId: user.id_clinica,

                clinic: {
                    id: clinica.id,
                    name: clinica.nombre,
                    address: clinica.direccion,
                    city: clinica.ciudad,
                    phone: clinica.telefono
                },

                token
            });

        } catch (error) {
            console.error('Error en /auth/login:', error);

            return res.status(500).json({
                message: 'Error interno al iniciar sesión'
            });
        }
    }
);





// Obtener y validar la sesión actual
router.get('/auth/me', autenticarToken, async (req, res) => {
    try {
        const rowsUsuario = await pool.query(
            `SELECT *
             FROM usuarios
             WHERE id = ?
             LIMIT 1`,
            [req.user.id]
        );

        if (rowsUsuario.length === 0) {
            return res.status(401).json({
                message: 'El usuario ya no existe'
            });
        }

        const user = rowsUsuario[0];

        const rowsClinica = await pool.query(
            `SELECT *
             FROM clinicas
             WHERE id = ?
             LIMIT 1`,
            [user.id_clinica]
        );

        if (rowsClinica.length === 0) {
            return res.status(404).json({
                message: 'No se encontró la clínica asociada'
            });
        }

        const clinica = rowsClinica[0];

        return res.status(200).json({
            user: {
                id: user.id,
                username: user.usuario,
                firstName: user.nombre,
                lastName: user.apellido,
                role: user.rol ?? user.nivel,
                professionalId: user.id_profesional ?? null
            },

            clinicId: user.id_clinica,

            clinic: {
                id: clinica.id,
                name: clinica.nombre,
                address: clinica.direccion,
                city: clinica.ciudad,
                phone: clinica.telefono
            }
        });

    } catch (error) {
        console.error('Error en /auth/me:', error);

        return res.status(500).json({
            message: 'Error al validar la sesión'
        });
    }
});



router.post('/auth/logout', autenticarToken, async (req, res) => {
    try {
        const tokenHash = obtenerHashToken(req.token);

        const expiraEn = new Date(req.user.exp * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');

        await pool.query(
            `INSERT INTO tokens_revocados
                (token_hash, expira_en)
             VALUES (?, ?)`,
            [tokenHash, expiraEn]
        );

        return res.status(200).json({
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error en /auth/logout:', error);

        return res.status(500).json({
            message: 'Error al cerrar la sesión'
        });
    }
});




///////////http://localhost:4000/vl/clinicas/1/turnos
///Parámetro	Qué hace	Ejemplo
///fecha	Busca turnos de una fecha específica	fecha=2026-10-14
///profesionalId	Filtra por ID del profesional	profesionalId=5
///estado	Por ahora devuelve error, porque todavía no configuramos ese filtro	estado=confirmado

router.get(
    '/clinicas/:clinicId/turnos',
    autenticarToken,
    async (req, res) => {
        try {
            const { clinicId } = req.params;
            const { fecha, profesionalId, estado } = req.query;

            if (!/^\d+$/.test(clinicId)) {
                return res.status(400).json({
                    message: 'clinicId inválido'
                });
            }

            // Validar acceso a la clínica
            if (
                Number(req.user.id_clinica) !== Number(clinicId)
            ) {
                return res.status(403).json({
                    message: 'No tenés acceso a esta clínica'
                });
            }

            // Filtrar siempre por la clínica solicitada
            const condiciones = [
                't.id_clinica = ?',
                't.fecha IS NOT NULL'
            ];

            const parametros = [clinicId];

            // Filtro por fecha
            if (fecha) {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                    return res.status(400).json({
                        message: 'La fecha debe tener formato YYYY-MM-DD'
                    });
                }

                condiciones.push('t.fecha = ?');
                parametros.push(fecha);
            }

            // Filtro por profesional
            if (profesionalId) {
                if (!/^\d+$/.test(profesionalId)) {
                    return res.status(400).json({
                        message: 'profesionalId inválido'
                    });
                }

                condiciones.push('t.id_usuario = ?');
                parametros.push(profesionalId);
            }

            // El filtro estado queda pendiente hasta confirmar
            // el nombre de la columna y sus valores en la tabla.
            if (estado) {
                return res.status(400).json({
                    message: 'El filtro estado todavía no está implementado'
                });
            }

            const turnos = await pool.query(
                `SELECT
                    t.id,
                    t.id_clinica AS clinicId,
                    t.id_usuario AS professionalId,
                    t.fecha AS date,
                    TIME_FORMAT(t.hora, '%H:%i') AS time
                 FROM turnos t
                 WHERE ${condiciones.join(' AND ')}
                 ORDER BY t.fecha ASC, t.hora ASC`,
                parametros
            );

            // Convertir BigInt a string para evitar errores de JSON
            const turnosJSON = turnos.map((turno) =>
                Object.fromEntries(
                    Object.entries(turno).map(([clave, valor]) => [
                        clave,
                        typeof valor === 'bigint'
                            ? valor.toString()
                            : valor
                    ])
                )
            );

            return res.status(200).json(turnosJSON);

        } catch (error) {
            console.error(
                'Error al obtener turnos de clínica:',
                error
            );

            return res.status(500).json({
                message: 'Error al obtener los turnos de la clínica'
            });
        }
    }
);








export default router;