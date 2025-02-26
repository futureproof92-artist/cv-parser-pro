
export async function processFileWithVision(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://autixypkmyfzypmqnsgf.supabase.co/functions/v1/process-cv', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al procesar el archivo');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error en el procesamiento de Vision API:', error);
    throw error;
  }
}
