import express from "express";
const router = express.Router();
import pool from "../database.js";


/// borrar despues




router.get('/', async (req, res) => {
    console.log('hola')
try {
   pipo= 'HOLA MUNDO '
   res.json(pipo);
} catch (error) {
  res.json('error')
}
   


 
//res.render('index')
})


router.get('/exitosignupp', async (req, res) => {
res.json('Modificado correctamente')

})

router.get('/noexitop', async (req, res) => {
  res.json('Error algo sucedio, complete correctamente los datos')

})

router.get('/prueba', async (req, res) => {
  console.log((new Date(Date.now())).toLocaleDateString())
  console.log((new Date(Date.now())))
  console.log((new Date.now()))
try {

} catch (error) {
res.json(['error'])
}
 



//res.render('index')
})


export default router;