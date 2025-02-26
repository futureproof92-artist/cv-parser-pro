
import { toast } from "sonner";

export async function processFileWithVision(file: File): Promise<string> {
  try {
    console.log("🖼️ Iniciando procesamiento con Vision API...");
    const formData = new FormData();
    formData.append('file', file);

    const maxRetries = 3;
    let lastError;

    const currentOrigin = window.location.origin;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Intento ${attempt}/${maxRetries}`);
        
        // Timeout para la petición
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch('https://autixypkmyfzypmqnsgf.functions.supabase.co/process-cv', {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dGl4eXBrbXlmenlwbXFuc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTgyODYsImV4cCI6MjA1NjE3NDI4Nn0.vWRAphkntuxDJbgSxsleei5R-gG0NwGLQIbtXUEjEyI',
            'Origin': currentOrigin,
            'Content-Type': 'multipart/form-data'
          },
          body: formData,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.text) {
          throw new Error('No se recibió texto del servidor');
        }

        console.log("✅ Texto extraído exitosamente con Vision API");
        return data.text;
      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('No se pudo procesar el archivo después de varios intentos');
  } catch (error) {
    console.error('❌ Error fatal en Vision API:', error);
    toast.error(`Error en Vision API: ${error.message}`);
    throw error;
  }
}
