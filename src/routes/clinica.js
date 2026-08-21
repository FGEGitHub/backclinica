import express from "express";
import dotenv from "dotenv";
const router = express.Router();
import cron from "node-cron";
import { } from "../lib/auth.js";
import pool from "../database.js";

//import { sendWhatsappMessage } from "./whatsapclient.js";

import { Payment } from "mercadopago";

import { Preference, MercadoPagoConfig } from "mercadopago";

dotenv.config();
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;


const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

router.post("/crear-preferencia", async (req, res) => {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Consulta Clínica",
            quantity: 1,
            unit_price: 5000,
            currency_id: "ARS",
          },
        ],
 back_urls: {
  success: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/success",
  failure: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/failure",
  pending: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/pending",
},
auto_return: "approved",
      },
    });

    res.json({ id: result.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error Mercado Pago" });
  }
});
router.post("/success", async (req, res) => {
console.loft("Pago exitoso:", req.body);
res.send("¡Pago exitoso! Gracias por su compra.");
});



router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
console.log("Webhook recibido:", type, data);
    if (type === "payment") {
      const paymentId = data.id;

      const payment = new Payment(client);
      const pago = await payment.get({ id: paymentId });

      if (pago.status === "approved") {
        const id_turno = pago.external_reference;

        await pool.query(
          `UPDATE turnos 
           SET estado = 'confirmado', modo_solicitud = 'web'
           WHERE id = ?`,
          [id_turno]
        );
        console.log("Turno confirmado:", id_turno);
try {
  const mensajee  ="confirmado"
   //   await sendWhatsappMessage("5493794702861", mensajee);
      console.log("✅ Mensaje de WhatsApp enviado a:", 34784);
    } catch (error) {
      console.log(error);
    }
        console.log("✅ Turno solicitado:", id_turno);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error webhook:", error);
    res.sendStatus(500);
  }
});



 

router.get('/traerusuario/:cuil_cuit', async (req, res) => {
    const cuil_cuit = req.params.cuil_cuit
   console.log(cuil_cuit)


    const usuario = await pool.query('select * from usuarios where usuario= ? ', [cuil_cuit])
   
    res.json(usuario)


})


router.get('/traerEmpresas/', async (req, res) => {
  


    const usuario = await pool.query('select * from usuarios  ')
   
    res.json(usuario)


})

router.get('/traerpacientes/:id', async (req, res) => {
const    id = req.params.id
    const usuario = await pool.query('select * from pacientes where baja="No" and id_usuario= ? ', [id])
   
    res.json(usuario)


})


router.get('/traerTurnosDisponibles', async (req, res) => {
  try {
    const turnos = await pool.query(`
      SELECT 
        t.*,
        p.dni,
        p.id AS id_pacientee,
        u.consulta_paga
      FROM turnos t
      LEFT JOIN pacientes p ON t.id_paciente = p.id
      LEFT JOIN usuarios u ON t.id_usuario = u.id
      WHERE t.baja = "No"
      ORDER BY t.hora ASC, p.dni ASC
    `);

    res.json(turnos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al traer turnos' });
  }
});

router.get('/traerTurnosDisponibles/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const turnos = await pool.query(`
      SELECT 
        t.*,
        p.dni,
        p.id AS id_pacientee,
        u.consulta_paga
      FROM turnos t
      LEFT JOIN pacientes p ON t.id_paciente = p.id
      LEFT JOIN usuarios u ON t.id_usuario = u.id
      WHERE
        t.baja = 'No'
        AND t.id_usuario = ?
      ORDER BY
        t.fecha ASC,
        t.hora ASC,
        p.dni ASC
    `, [id]);

    res.json(turnos);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al traer turnos' });
  }
});

router.get('/traerturnosusuario/:id', async (req, res) => {
  try {
    const idUsuario = req.params.id;

    // Buscar configuración del usuario
    const usuarios = await pool.query(
      `SELECT consulta_paga
       FROM usuarios
       WHERE id = ?`,
      [idUsuario]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const consulta_paga = usuarios[0].consulta_paga;

    // Traer turnos
    const turnos = await pool.query(
      `SELECT 
        t.*, 
        p.nombre,
        p.apellido,
        p.dni,
        p.id AS id_pacientee
      FROM turnos t
      LEFT JOIN pacientes p ON t.id_paciente = p.id
      WHERE t.baja = "No"
        AND t.id_usuario = ?
      ORDER BY t.hora ASC, p.dni ASC`,
      [idUsuario]
    );

    // Agregar consulta_paga a cada turno
    const turnosConParametros = turnos.map(turno => ({
      ...turno,
      consulta_paga
    }));

    res.json(turnosConParametros);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: 'Error al traer turnos'
    });
  }
});


router.get('/traerturnos',  async (req, res) => {
  try {
    const turnos = await pool.query(`
      SELECT 
        t.*, 
        p.nombre,
        p.apellido,
        p.dni,
        p.id AS id_pacientee
      FROM turnos t
      LEFT JOIN pacientes p ON t.id_paciente = p.id
      where t.baja="No" 
      ORDER BY t.hora ASC, p.dni ASC
    `);

    res.json(turnos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al traer turnos' });
  }
});

router.post('/modificarusuario',  async (req, res) => {
  try {
    const { id, ...datos } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID' });
    }

    // Quitamos null / undefined
    const campos = Object.keys(datos).filter(
      (k) => datos[k] !== undefined && datos[k] !== null
    );

    if (campos.length === 0) {
      return res.status(400).json({ error: 'No hay datos para modificar' });
    }

    const setSQL = campos.map(campo => `${campo} = ?`).join(', ');
    const values = campos.map(campo => datos[campo]);

    const sql = `
      UPDATE pacientes
      SET ${setSQL}
      WHERE id = ?
    `;

    values.push(id);

    await pool.query(sql, values);

    res.json('Paciente modificado correctamente');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al modificar paciente' });
  }
});



router.post('/crearturno',  async (req, res) => {
    try {
        const {
            id_paciente,
            fecha,
            hora,
            profesional,
            motivo,
            observaciones
        } = req.body;

        const sql = `
            INSERT INTO turnos
            (id_paciente, fecha, hora,  motivo, observaciones)
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            id_paciente || null,
            fecha || null,
            hora || null,
       
            motivo || null,
            observaciones || null
        ];

        const resultado = await pool.query(sql, values);

        res.json("Turno creado correctamente");

    } catch (error) {
        console.error("Error al crear turno:", error);
        res.status(500).json({ ok: false, error: "Error en el servidor" });
    }
});


router.post('/actualizarPerfil', async (req, res) => {
  try {
    const {
      id,
      nombre_clinica,
      foto,
      color_nav,
      color_fondo
    } = req.body;

    const campos = [];
    const values = [];

    if (nombre_clinica !== undefined) {
      campos.push('nombre_clinica = ?');
      values.push(nombre_clinica);
    }

    if (foto !== undefined) {
      campos.push('foto = ?');
      values.push(foto);
    }

    if (color_nav !== undefined) {
      campos.push('color_nav = ?');
      values.push(color_nav);
    }

    if (color_fondo !== undefined) {
      campos.push('color_fondo = ?');
      values.push(color_fondo);
    }

    if (campos.length === 0) {
      return res.status(400).json({
        error: 'No se recibieron campos para actualizar'
      });
    }

    values.push(id);

    const sql = `
      UPDATE usuarios
      SET ${campos.join(', ')}
      WHERE id = ?
    `;

    await pool.query(sql, values);

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error al actualizar perfil'
    });
  }
});

router.post('/actualizarParametros', async (req, res) => {
  const {
    id,
    precio_consulta,
    tipo_consulta,
    consulta_paga
  } = req.body;

  if (!id) {
    return res.status(400).json({
      error: 'Falta el ID del usuario'
    });
  }

  const connection = await pool.getConnection();

  try {
    const resultado = await connection.query(
      `UPDATE usuarios
       SET
         precio_consulta = ?,
         tipo_consulta = ?,
         consulta_paga = ?
       WHERE id = ?`,
      [
        precio_consulta ?? null,
        tipo_consulta ?? null,
        consulta_paga ?? null,
        id
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json('Parámetros actualizados correctamente');

  } catch (error) {
    console.error('Error al actualizar parámetros:', error);

    res.status(500).json({
      error: 'Error al actualizar los parámetros del usuario'
    });

  } finally {
    connection.release();
  }
});


router.post('/agregarPersona',  async (req, res) => {
  try {

    const {
      nombre,
      apellido,
      dni,
      genero,
      fecha_nacimiento,
      fecha_ingreso,
      telefono,
      direccion,
      obra_social,
      numero_afiliado,
      email,
      observaciones,

      hospitalizacion_2_anios,
      atencion_medica_6_meses,
      tratamientos_quirurgicos,
      medicacion_actual,
      alergias,
      grupo_sanguineo,
      antecedentes_hereditarios,
      problemas_coagulacion,
      fuma,
      embarazo,
      anticonceptivos,
      presion_arterial,
      hta,
      enfermedades_sistemicas,
      enfermedades_transmision_sexual,
      hiv,
      id_usuario

    } = req.body;

    if (!dni) {
      return res.status(400).json('El DNI es obligatorio');
    }

    // 🔎 Verificar si ya existe el DNI
    const existe = await pool.query(
      `SELECT id FROM pacientes 
       WHERE dni = ? 
       AND baja = 'No'`,
      [dni]
    );

    if (existe.length > 0) {
      return res.json({
        ok: false,
        msg: "Ya existe un paciente con ese DNI"
      });
    }

    // ➕ Insertar paciente
    const sql = `
      INSERT INTO pacientes
      (
        nombre,
        apellido,
        dni,
        genero,
        fecha_nacimiento,
        fecha_ingreso,
        telefono,
        direccion,
        obra_social,
        numero_afiliado,
        email,
        observaciones,

        hospitalizacion_2_anios,
        atencion_medica_6_meses,
        tratamientos_quirurgicos,
        medicacion_actual,
        alergias,
        grupo_sanguineo,
        antecedentes_hereditarios,
        problemas_coagulacion,
        fuma,
        embarazo,
        anticonceptivos,
        presion_arterial,
        hta,
        enfermedades_sistemicas,
        enfermedades_transmision_sexual,
        hiv,
        id_usuario
      )

      VALUES
      (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?
      )
    `;

    const values = [

      nombre || null,
      apellido || null,
      dni,
      genero || null,
      fecha_nacimiento || null,
      fecha_ingreso || null,
      telefono || null,
      direccion || null,
      obra_social || null,
      numero_afiliado || null,
      email || null,
      observaciones || null,

      hospitalizacion_2_anios || null,
      atencion_medica_6_meses || null,
      tratamientos_quirurgicos || null,
      medicacion_actual || null,
      alergias || null,
      grupo_sanguineo || null,
      antecedentes_hereditarios || null,
      problemas_coagulacion || null,
      fuma || null,
      embarazo || null,
      anticonceptivos || null,
      presion_arterial || null,
      hta || null,
      enfermedades_sistemicas || null,
      enfermedades_transmision_sexual || null,
      hiv || null,
      id_usuario || null

    ];

    await pool.query(sql, values);

    res.json({
      ok: true,
      msg: 'Paciente agregado correctamente'
    });

  } catch (error) {

    console.error(
      'Error al agregar paciente:',
      error
    );

    res.status(500).json(
      'Error al agregar paciente'
    );
  }
});


router.get('/estadoSolicitud/:id', async (req, res) => {
  const id = req.params.id;

  try {

    const rows = await pool.query(
      `
      SELECT 
        id,
        estado,
        vencimiento_pago
      FROM turnos
      WHERE id = ?
      `,
      [id]
    );

    // no existe
    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Solicitud no encontrada',
      });
    }

    // devolver datos
    return res.json({
      ok: true,
      solicitud: rows[0],
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      mensaje: 'Error del servidor',
    });
  }
});




router.get('/datospaciente/:id', async (req, res) => {
  const id = req.params.id
  try {  const chiques = await pool.query('select * from pacientes where id =?', [id])

      const turnos = await pool.query('select * from turnos where id_paciente =?', [id])

     const consultas = await pool.query('select * from consultas where id_paciente =?', [id])
    res.json([chiques, "imagenBase64", turnos, consultas])
  } catch (error) {
    console.log(error)
    res.json([])
  }

})
////////////////////traerusuario


router.get('/traerperfil/:id', async (req, res) => {
  const { id } = req.params;
const usuariod =  await pool.query('select * from usuarios where id =?', [id])
res.json(usuariod[0])
})
router.get('/traerTurnoDetalle/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Traer turno + paciente
    const rows = await pool.query(
      `SELECT 
         t.*,
         p.id        AS paciente_id,
         p.nombre,
         p.apellido,
         p.dni,
         p.telefono,
         p.direccion,
         p.fecha_nacimiento,
         p.fecha_ingreso
       FROM turnos t
       JOIN pacientes p ON t.id_paciente = p.id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // 2️⃣ Traer consultas asociadas al turno
    const consultas = await pool.query(
      `SELECT * FROM consultas WHERE id_turno = ?`,
      [id]
    );

    // 3️⃣ Tomar la primera consulta si existe
    const consulta = consultas.length > 0
      ? {
          motivo: consultas[0].motivo,
          evolucion: consultas[0].evolucion,
          tratamiento: consultas[0].tratamiento,
        }
      : null;

    // 4️⃣ Respuesta final
    res.json({
      turno: {
        id: rows[0].id,
        fecha: rows[0].fecha,
        hora: rows[0].hora,
        motivo: rows[0].motivo,
        estado: rows[0].estado,
        observaciones: rows[0].observaciones,
      },
      paciente: {
        id: rows[0].paciente_id,
        nombre: rows[0].nombre,
        apellido: rows[0].apellido,
        dni: rows[0].dni,
        telefono: rows[0].telefono,
        direccion: rows[0].direccion,
        fecha_nacimiento: rows[0].fecha_nacimiento,
      },
      consulta
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al traer turno' });
  }
});



router.post('/borrarpaciente',  async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID del paciente' });
    }

    await conn.beginTransaction();

    // Baja lógica en pacientes
    await conn.query(
      `UPDATE pacientes SET baja = 'Si' WHERE id = ?`,
      [id]
    );

    // Baja lógica en turnos
    await conn.query(
      `UPDATE turnos SET baja = 'Si' WHERE id_paciente = ?`,
      [id]
    );

    await conn.commit();

    res.json('Paciente dado de baja correctamente');

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json( 'Error al dar de baja al paciente');
  } finally {
    conn.release();
  }
});



router.post(
  "/guardarodontogramapaciente",
  
  async (req, res) => {

    try {

      const {
        id_paciente,
        odontograma,
      } = req.body;

      console.log(
        "GUARDANDO:"
      );

    
      // buscar si existe

      const sqlBuscar = `
        SELECT *
        FROM odontogramas
        WHERE id_paciente = ?
      `;

      const rows =
        await pool.query(
          sqlBuscar,
          [id_paciente]
        );

      // SI EXISTE -> UPDATE

      if (
        rows.length > 0
      ) {

        const sqlUpdate = `
          UPDATE odontogramas
          SET odontograma = ?
          WHERE id_paciente = ?
        `;

        await pool.query(
          sqlUpdate,
          [
            JSON.stringify(
              odontograma
            ),

            id_paciente,
          ]
        );

      }

      // SI NO EXISTE -> INSERT

      else {

        const sqlInsert = `
          INSERT INTO odontogramas
          (
            id_paciente,
            odontograma
          )
          VALUES (?, ?)
        `;

        await pool.query(
          sqlInsert,
          [
            id_paciente,

            JSON.stringify(
              odontograma
            ),
          ]
        );
      }

      res.status(200).json({

        ok: true,

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        ok: false,

      });

    }
  }
);


router.get(
  "/traerodontograma/:id",
 
  async (req, res) => {

    try {

      const id_paciente =
        req.params.id;

      const sql = `
        SELECT *
        FROM odontogramas
        WHERE id_paciente = ?
        LIMIT 1
      `;

      const rows =
        await pool.query(
          sql,
          [id_paciente]
        );

      if (
        rows.length === 0
      ) {

        return res
        .status(200)
        .json({
          odontograma: {},
        });
      }

      res.status(200).json({

        odontograma:
          JSON.parse(
            rows[0]
            .odontograma
          ),

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        ok: false,

      });

    }
  }
);
// ==========================================
// NUEVA CONSULTA
// ==========================================

router.post(
  "/guardarConsultanueva",
  
  async (req, res) => {
    const {
      id_paciente,
      motivo,
      evolucion,
      tratamiento,
      fecha,
    } = req.body;

    try {
      // ==========================================
      // VALIDAR PACIENTE
      // ==========================================
      if (!id_paciente) {
        return res.status(400).json({
          message: "Falta id_paciente",
        });
      }

      // ==========================================
      // CREAR CONSULTA
      // ==========================================
      const result = await pool.query(
        `
        INSERT INTO consultas
        (
          id_paciente,
          motivo,
          evolucion,
          tratamiento,
          fecha
        )
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          id_paciente,
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date(),
        ]
      );

      res.json({
        ok: true,
        accion: "creada",
    
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Error al guardar consulta",
      });
    }
  }
);





////////referente  a un turno, traer datos del paciente y consultas asociadas a ese turno
router.post("/guardarConsulta", async (req, res) => {
  const {
    id_turno,
    id_paciente,
    motivo,
    evolucion,
    tratamiento,
    fecha,
  } = req.body;

  try {
    const turnoValido =
      id_turno &&
      id_turno !== "sin_turno";

    let pacienteFinal = id_paciente;

    // ==========================================
    // BUSCAR PACIENTE DESDE TURNO
    // ==========================================
    if (!pacienteFinal && turnoValido) {
      const turnoRows = await pool.query(
        "SELECT id_paciente FROM turnos WHERE id = ?",
        [id_turno]
      );

      if (turnoRows.length == 0) {
        return res
          .status(404)
          .json({
            message: "Turno no encontrado",
          });
      }

      pacienteFinal =
        turnoRows[0].id_paciente;
    }

    if (!pacienteFinal) {
      return res
        .status(400)
        .json({
          message: "Falta id_paciente",
        });
    }

    // ==========================================
    // CONSULTA SIN TURNO
    // ==========================================
    if (!turnoValido) {
      const result = await pool.query(
        `
        INSERT INTO consultas
        (
          id_paciente,
          motivo,
          evolucion,
          tratamiento,
          fecha
        )
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          pacienteFinal,
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date(),
        ]
      );

      return res.json({
        ok: true,
        accion: "creada",

      });
    }

    // ==========================================
    // VERIFICAR SI YA EXISTE
    // ==========================================
    const existente = await pool.query(
      `
      SELECT id
      FROM consultas
      WHERE id_turno = ?
    `,
      [id_turno]
    );

    // ==========================================
    // SI YA EXISTE → ERROR
    // ==========================================
    if (existente.length > 0) {
      return res.status(409).json({
        message:
          "La consulta ya existe. Use modificarConsulta.",
      });
    }

    // ==========================================
    // INSERTAR CONSULTA
    // ==========================================
    const result = await pool.query(
      `
      INSERT INTO consultas
      (
        id_turno,
        id_paciente,
        motivo,
        evolucion,
        tratamiento,
        fecha
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        id_turno,
        pacienteFinal,
        motivo,
        evolucion,
        tratamiento,
        fecha || new Date(),
      ]
    );

    // ==========================================
    // ACTUALIZAR TURNO
    // ==========================================
    await pool.query(
      `
      UPDATE turnos
      SET estado = 'Atendido'
      WHERE id = ?
    `,
      [id_turno]
    );

    res.json({
      ok: true,
      accion: "creada",
   
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error al guardar consulta",
    });
  }
});



// ==========================================
// MODIFICAR CONSULTA
// ==========================================
router.post(
  "/modificarConsulta",
  async (req, res) => {
    try {
      const {
        id,
        motivo,
        evolucion,
        tratamiento,
        fecha,
      } = req.body;

      // ==========================================
      // VERIFICAR EXISTENCIA
      // ==========================================
      const consulta =
        await pool.query(
          `
          SELECT id
          FROM consultas
          WHERE id = ?
        `,
          [id]
        );

      if (consulta.length === 0) {
        return res.status(404).json({
          message:
            "Consulta no encontrada",
        });
      }

      // ==========================================
      // UPDATE
      // ==========================================
      await pool.query(
        `
        UPDATE consultas
        SET
          motivo = ?,
          evolucion = ?,
          tratamiento = ?,
          fecha = ?
        WHERE id = ?
      `,
        [
          motivo,
          evolucion,
          tratamiento,
          fecha || new Date(),
          id,
        ]
      );

      res.json({
        ok: true,
        accion: "modificada",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Error al modificar consulta",
      });
    }
  }
);

router.post('/nuevoturnodisp',  async (req, res) => {
  try {
    let { fecha, hora, observaciones, id_usuario } = req.body;
    // Validaciones mínimas
    if (!fecha || !hora) {
      return res.status(400).json({ message: "Fecha y hora son obligatorias" });
    }

    // Si observaciones viene vacío → texto por defecto
    if (!observaciones || observaciones.trim() === "") {
      observaciones = "Sin observaciones";
    }

    const sql = `
      INSERT INTO turnos
      (fecha, hora, observaciones, id_usuario)
      VALUES (?, ?, ?, ?)
    `;

    await pool.query(sql, [fecha, hora, observaciones, id_usuario]);

    res.json({ message: "Turno creado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear turno" });
  }
});

router.post('/agendarapaciente',  async (req, res) => {
  try {
    const { id_turno, id_paciente, categoria } = req.body;

    // Validaciones básicas
    if (!id_turno || !id_paciente || !categoria) {
      return res.status(400).json({ 
        message: "Faltan datos obligatorios" 
      });
    }

    // Verificar que el turno exista
    const turno = await pool.query(
      "SELECT id FROM turnos WHERE id = ?",
      [id_turno]
    );

    if (turno.length === 0) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    // Actualizar turno con paciente y categoría
    const sql = `
      UPDATE turnos
      SET id_paciente = ?, categoria = ?
      WHERE id = ?
    `;

    await pool.query(sql, [id_paciente, categoria, id_turno]);

    res.json({ message: "Paciente agendado correctamente" });

  } catch (error) {
    console.error("Error en agendarapaciente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.post("/solicitarturno", async (req, res) => {
  try {
    const { id_turno, nombre, dni, telefono, categoria } = req.body;

    if (!id_turno || !nombre || !dni || !telefono || !categoria) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    // 1. Verificar / crear paciente
    const existe = await pool.query(
      "SELECT id FROM pacientes WHERE dni = ?",
      [dni]
    );

    let id_paciente;

    if (existe.length > 0) {
      id_paciente = existe[0].id;
    } else {
      const nuevo = await pool.query(
        "INSERT INTO pacientes (nombre, dni, telefono) VALUES (?, ?, ?)",
        [nombre, dni, telefono]
      );
      id_paciente = nuevo.insertId;
    }

    // 2. Verificar turno
    const turno = await pool.query(
      "SELECT id, id_paciente FROM turnos WHERE id = ?",
      [id_turno]
    );

    if (turno.length === 0) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    if (turno[0].id_paciente) {
      return res.status(409).json({ message: "Turno ya ocupado" });
    }

  const vencimiento = new Date(Date.now() + 5 * 60 * 1000);

await pool.query(
  `UPDATE turnos
   SET 
      id_paciente = ?,
      categoria = ?,
      estado = 'pendiente_pago',
      vencimiento_pago = ?
   WHERE id = ?`,
  [id_paciente, categoria, vencimiento, id_turno]
);

    // 4. Crear preferencia de pago
const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Consulta Clínica",
            quantity: 1,
            unit_price: 5000,
            currency_id: "ARS",
          },
        ],
        external_reference: String(id_turno), // MUY IMPORTANTE
        notification_url: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/webhook",
     back_urls: {
  success: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/success",
  failure: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/failure",
  pending: "https://unideographic-deborah-winnable.ngrok-free.dev/clinica/pending",
},
auto_return: "approved",
      },
    });
    // 5. Responder con link de pago
    res.json({
      message: "Turno reservado, pendiente de pago",
   pago_url: result.sandbox_init_point,
      preference_id: result.id,
    });

  } catch (error) {
    console.error("Error solicitarturno:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.post("/confirmarTurnoNoPago", async (req, res) => {
  try {
    const {
      id_turno,
      nombre,
      dni,
      telefono,
      categoria,
        id_empresa,
    } = req.body;

    if (
      !id_turno ||
      !nombre ||
        !id_empresa ||
      !dni ||
      !telefono ||
      !categoria
    ) {
      return res.status(400).json({
        message: "Faltan datos",
      });
    }

    // =========================
    // VERIFICAR / CREAR PACIENTE
    // =========================

    const existe = await pool.query(
      "SELECT id FROM pacientes WHERE dni = ?",
      [dni]
    );

    let id_paciente;

    if (existe.length > 0) {
      id_paciente = existe[0].id;

      // actualiza datos por si cambiaron
      await pool.query(
        `UPDATE pacientes
         SET nombre = ?, telefono = ?
         WHERE id = ?`,
        [nombre, telefono, id_paciente]
      );
    } else {
      const nuevo = await pool.query(
        `INSERT INTO pacientes
        (nombre, dni, telefono, id_usuario)
        VALUES (?, ?, ?, ?)`,
        [nombre, dni, telefono, id_empresa]
      );

      id_paciente = nuevo.insertId;
    }

    // =========================
    // VERIFICAR TURNO
    // =========================

    const turno = await pool.query(
      `SELECT id, id_paciente
       FROM turnos
       WHERE id = ?`,
      [id_turno]
    );

    if (turno.length === 0) {
      return res.status(404).json({
        message: "Turno no encontrado",
      });
    }

    if (turno[0].id_paciente) {
      return res.status(409).json({
        message: "Turno ya ocupado",
      });
    }

    // =========================
    // CONFIRMAR TURNO
    // =========================

    await pool.query(
      `UPDATE turnos
       SET
         id_paciente = ?,
         categoria = ?,
         estado = 'confirmado',
         modo_solicitud = 'web'
       WHERE id = ?`,
      [
        id_paciente,
        categoria,
        id_turno,
      ]
    );

    return res.json({
      success: true,
      message:
        "Turno confirmado correctamente",
     
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error al confirmar turno",
    });
  }
});
//cron.schedule("*/1 * * * *", async () => {
  /* try {

    await pool.query(`
      UPDATE turnos
      SET
        estado = 'libre',
        id_paciente = NULL,
        categoria = NULL,
        vencimiento_pago = NULL
      WHERE estado = 'pendiente_pago'
      AND vencimiento_pago < NOW()
    `);

    console.log("✅ Turnos vencidos liberados");

  } catch (error) {
    console.log(error);
  } 
}); */



export default router;