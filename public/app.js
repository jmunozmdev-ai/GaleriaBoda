// --- LÓGICA DE USUARIO ---
// Revisamos si el usuario ya se había registrado antes en este celular
const savedUser = localStorage.getItem('galeria_user');
if (savedUser) {
    activarApp(savedUser);
}

function saveUser() {
    const name = document.getElementById('usernameInput').value;
    if (name.trim() === '') {
        alert("Por favor, ingresa tu nombre para continuar.");
        return;
    }
    // Guardamos el nombre en el navegador del celular
    localStorage.setItem('galeria_user', name.trim());
    activarApp(name.trim());
}

function activarApp(nombre) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('appView').style.display = 'block';
    document.getElementById('greetingText').innerText = `📸 Hola, ${nombre}`;
    loadGallery(); // Cargamos las fotos en cuanto entran
}

// --- LÓGICA DE SUBIDA ---
async function procesarSubida(event) {
    const file = event.target.files[0];
    if (!file) return;

    const currentUser = localStorage.getItem('galeria_user') || 'Anónimo';
    const statusText = document.getElementById('statusText');
    const botones = document.querySelectorAll('.cam-button');
    
    statusText.innerText = "⏳ Subiendo tu foto...";
    statusText.style.color = "#ffdd59";
    
    // Desactivar ambos botones mientras sube
    botones.forEach(btn => {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    });

    try {
        const signResponse = await fetch(`/api/sign?user=${encodeURIComponent(currentUser)}`);
        const signData = await signResponse.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signData.apiKey);
        formData.append("timestamp", signData.timestamp);
        formData.append("signature", signData.signature);
        formData.append("context", signData.context); 

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
            method: "POST",
            body: formData
        });

        const uploadData = await uploadResponse.json();

        if (uploadData.secure_url) {
            statusText.innerText = "✅ ¡Foto subida!";
            statusText.style.color = "#0be881";
            loadGallery(); 
        } else {
            throw new Error("Error en Cloudinary");
        }
    } catch (error) {
        statusText.innerText = "❌ Error al subir. Intenta de nuevo.";
        statusText.style.color = "#ff4757";
    } finally {
        // Reactivar botones
        botones.forEach(btn => {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        });
        event.target.value = ''; 
    }
}

// Conectamos la misma función a ambos botones
document.getElementById('cameraInput').addEventListener('change', procesarSubida);
document.getElementById('galleryInput').addEventListener('change', procesarSubida);

// --- LÓGICA DE LA GALERÍA ---
async function loadGallery() {
    const galleryDiv = document.getElementById('gallery');
    galleryDiv.innerHTML = '<p>Cargando fotos...</p>';

    try {
        const response = await fetch('/api/photos');
        const photos = await response.json();

        galleryDiv.innerHTML = '';

        if (photos.length === 0) {
            galleryDiv.innerHTML = '<p>No hay fotos aún. ¡Sé el primero!</p>';
            return;
        }

        photos.forEach(photo => {
            // Creamos un contenedor para la foto y el nombre del autor
            const itemDiv = document.createElement('div');
            itemDiv.style.backgroundColor = "#2a2a2a";
            itemDiv.style.borderRadius = "8px";
            itemDiv.style.padding = "5px";
            itemDiv.style.textAlign = "center";

            // NUEVO: Separamos la versión pesada de la versión ligera
            const urlOriginal = photo.url;
            const urlMiniatura = photo.url.replace('/upload/', '/upload/w_400,c_fill,q_auto,f_auto/');

            // NUEVO: Creamos un enlace para poder hacer clic en la foto
            const link = document.createElement('a');
            link.href = urlOriginal;
            link.target = "_blank"; // Abre la foto original en una pestaña nueva

            const img = document.createElement('img');
            img.src = urlMiniatura; // Mostramos la miniatura ligera en la cuadrícula
            img.style.width = "100%";
            img.style.height = "150px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "5px";

            const autorText = document.createElement('p');
            autorText.innerText = `📸 ${photo.autor}`;
            autorText.style.margin = "5px 0";
            autorText.style.fontSize = "14px";
            autorText.style.color = "#ddd";

            // NUEVO: Metemos la imagen dentro del enlace, y todo al contenedor
            link.appendChild(img);
            itemDiv.appendChild(link);
            itemDiv.appendChild(autorText);
            galleryDiv.appendChild(itemDiv);
        });
    } catch (error) {
        galleryDiv.innerHTML = '<p>Error al cargar la galería.</p>';
    }
}
