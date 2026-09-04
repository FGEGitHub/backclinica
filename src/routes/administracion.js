import express from "express";
const router = express.Router();

import passport from "passport";
import pool from "../database.js";




  router.post('/signupp',passport.authenticate('local.registroadmin', {
    successRedirect: '/exitosignup',
    failureRedirect:'/noexito',
    failureFlash:true

}))
  router.post('/signupcl',passport.authenticate('local.signupcl', {
    successRedirect: '/exitosignup',
    failureRedirect:'/noexito',
    failureFlash:true

}))

router.post('/registroemprendedora',passport.authenticate('local.registroemprendedora', {
  successRedirect: '/exitosignup',
  failureRedirect:'/noexito',
  failureFlash:true

}))

router.post('/modificarusuario',  passport.authenticate('local.modificadoradmin', {
  successRedirect: '/exitosignupp',
  failureRedirect:'/exitosignupp',
  failureFlash:true

}))


router.post('/borrarusuario', async (req, res) => {
  const { id } = req.body
  try {
    await pool.query('delete  from  usuarios where id = ?',[id])
    res.json('Realizado')
  } catch (error) {
    console.log(error)
    res.json('no realizado')
  }

})

export default router;