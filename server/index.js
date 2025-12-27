// server/index.js (CommonJS)
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')

const app = express()
const PORT = process.env.PORT || 4000

// ----- Middlewares -----
app.use(cors())
app.use(express.json())

// ----- Vérifier ce que charge .env -----
console.log('SMTP_USER =', process.env.SMTP_USER)
console.log(
  'SMTP_PASS length =',
  process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
)

// ----- Transporteur Nodemailer -----
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                  // ex: "smtp.gmail.com"
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Vérifier la connexion SMTP au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur SMTP:', error)
  } else {
    console.log('SMTP prêt à envoyer des emails')
  }
})

// ----- Route API pour envoyer la réservation -----
app.post('/send-reservation', async (req, res) => {
  try {
    const { nom, email, telephone, message, reservation } = req.body

    if (!nom || !email || !telephone) {
      return res.status(400).json({ ok: false, error: 'Champs obligatoires manquants.' })
    }

    const { date, time, people } = reservation || {}

    const html = `
      <h2>Nouvelle demande de réservation</h2>
      <p><strong>Nom :</strong> ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${telephone}</p>
      <p><strong>Message :</strong><br/>${message || '(aucun)'}</p>
      <hr/>
      <p><strong>Récapitulatif réservation :</strong></p>
      <p>Jour : ${date || 'non renseigné'}</p>
      <p>Heure : ${time || 'non renseignée'}</p>
      <p>Nombre de personnes : ${people || 'non renseigné'}</p>
    `

    await transporter.sendMail({
      from: `"Le Gourmet" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.RESERVATION_TO || process.env.SMTP_USER,
      replyTo: email, // l’adresse de l’utilisateur
      subject: `Nouvelle demande de réservation - ${nom}`,
      html,
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('Erreur envoi mail réservation :', err)
    res.status(500).json({ ok: false, error: "Erreur lors de l'envoi du mail." })
  }
})

// ----- Démarrage serveur -----
app.listen(PORT, () => {
  console.log(`Reservation mail server running on http://localhost:${PORT}`)
})
