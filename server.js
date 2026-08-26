const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuramos Cloudinary con las variables de tu archivo .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: '¡API de Galería de Eventos en línea y funcionando!' });
});

// NUEVO: Endpoint para generar la firma de subida segura
app.get('/api/sign', (req, res) => {
  // Generamos una marca de tiempo
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  // Cloudinary crea una firma criptográfica con tu secreto
  const signature = cloudinary.utils.api_sign_request(
    { timestamp: timestamp },
    process.env.CLOUDINARY_API_SECRET
  );

  // Devolvemos los datos al celular del invitado para que pueda subir la foto
  res.json({ 
    timestamp, 
    signature, 
    cloudName: process.env.CLOUDINARY_CLOUD_NAME, 
    apiKey: process.env.CLOUDINARY_API_KEY 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});