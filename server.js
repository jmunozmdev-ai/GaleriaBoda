const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ESTA LÍNEA ES CRÍTICA: Le dice a Node que muestre tu index.html
app.use(express.static('public')); 

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const PORT = process.env.PORT || 3000;

// Endpoint para generar firma incluyendo el nombre del usuario
app.get('/api/sign', (req, res) => {
  const username = req.query.user || 'Invitado'; 
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  // Metadato del autor
  const context = `autor=${username}`;

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

// Endpoint para obtener las fotos y la galería
app.get('/api/photos', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .with_field('context') 
      .max_results(50)
      .execute();
      
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});