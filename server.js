const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'))

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

// NUEVO: Endpoint para generar firma incluyendo el nombre del usuario
app.get('/api/sign', (req, res) => {
  // Recibimos el nombre del frontend, si no viene, usamos "Invitado"
  const username = req.query.user || 'Invitado'; 
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  // Creamos el contexto (metadata) que acompañará a la foto
  const context = `autor=${username}`;

  // Cloudinary DEBE firmar este contexto junto con el timestamp
  const signature = cloudinary.utils.api_sign_request(
    { timestamp: timestamp, context: context },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({ 
    timestamp, 
    signature, 
    context, 
    cloudName: process.env.CLOUDINARY_CLOUD_NAME, 
    apiKey: process.env.CLOUDINARY_API_KEY 
  });
});

// NUEVO: Endpoint para obtener las fotos con el nombre de sus autores
app.get('/api/photos', async (req, res) => {
  try {
    const result = await cloudinary.search
        .expression('resource_type:image')
        .sort_by('created_at', 'desc')
        .with_field('context') // <-- CRÍTICO: Le pedimos a Cloudinary que nos devuelva los metadatos
        .max_results(50)
        .execute();
        
    // Armamos un arreglo que incluye la URL y el nombre del autor
    const photos = result.resources.map(file => ({
        url: file.secure_url,
        autor: file.context ? file.context.autor : 'Invitado'
    }));
    
    res.json(photos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las fotos' });
  }
});