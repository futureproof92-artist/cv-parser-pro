
export async function processFileWithVision(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://autixypkmyfzypmqnsgf.functions.supabase.co/process-cv', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dGl4eXBrbXlmenlwbXFuc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTgyODYsImV4cCI6MjA1NjE3NDI4Nn0.vWRAphkntuxDJbgSxsleei5R-gG0NwGLQIbtXUEjEyI'
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error al procesar el archivo: ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error en el procesamiento de Vision API:', error);
    throw error;
  }
}
