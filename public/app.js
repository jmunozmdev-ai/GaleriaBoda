document.getElementById('cameraInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return; // Si el usuario cancela la cámara, no hacemos nada

    const statusText = document.getElementById('statusText');
    const labelButton = document.querySelector('.cam-button');
    
    // UX: Mostramos al usuario que estamos trabajando
    statusText.innerText = "⏳ Subiendo tu foto... por favor espera";
    statusText.style.color = "#ffdd59"; // Amarillo
    labelButton.style.opacity = "0.5";
    labelButton.style.pointerEvents = "none"; // Desactivamos el botón temporalmente

    try {
        // PASO 1: Pedirle permiso (firma) a nuestro backend Node.js
        const signResponse = await fetch('/api/sign');
        const signData = await signResponse.json();

        // PASO 2: Armar el paquete de datos para Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signData.apiKey);
        formData.append("timestamp", signData.timestamp);
        formData.append("signature", signData.signature);

        // PASO 3: Enviar la imagen PESADA directamente a los servidores de Cloudinary
        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
            method: "POST",
            body: formData
        });

        const uploadData = await uploadResponse.json();

        // PASO 4: Validar el éxito
        if (uploadData.secure_url) {
            statusText.innerText = "✅ ¡Foto subida con éxito!";
            statusText.style.color = "#0be881"; // Verde
            console.log("URL de la foto:", uploadData.secure_url);
        } else {
            throw new Error("Cloudinary no devolvió una URL válida");
        }
    } catch (error) {
        console.error(error);
        statusText.innerText = "❌ Hubo un error al subir la foto. Intenta de nuevo.";
        statusText.style.color = "#ff4757"; // Rojo
    } finally {
        // UX: Restauramos el botón para que puedan tomar otra foto
        labelButton.style.opacity = "1";
        labelButton.style.pointerEvents = "auto";
        
        // Limpiamos el input para que detecte si suben la misma foto dos veces
        event.target.value = ''; 
    }
});