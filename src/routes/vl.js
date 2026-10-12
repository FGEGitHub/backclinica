
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

router.get('/clinicas/:id/especialidades', async (req, res) => {
  const id = req.params.id;

  try {
    const especialidades = await pool.query(`
      SELECT 
        id,
        nombre
      FROM especialidades
      WHERE id_clinica = ?
      ORDER BY nombre ASC
    `, [id]);

    res.json(especialidades);

  } catch (error) {
    console.error('Error al obtener las especialidades:', error);

    res.status(500).json({
      message: 'Error al obtener las especialidades',
      error: error.message
    });
  }
});



router.get('/profesionales', async (req, res) => {
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
});





export default router;