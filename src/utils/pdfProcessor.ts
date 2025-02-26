
import * as pdfjsLib from 'pdfjs-dist';

// Inicializar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log("📄 Intentando extraer texto del PDF:", file.name);
    
    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Cargar el documento PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`📚 PDF cargado: ${pdf.numPages} páginas`);
    
    let fullText = '';
    
    // Extraer texto de cada página
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // Verificar si se extrajo texto
    if (fullText.trim().length === 0) {
      console.log("⚠️ No se pudo extraer texto del PDF, se necesitará OCR");
      return '';
    }
    
    console.log("✅ Texto extraído exitosamente del PDF");
    return fullText;
  } catch (error) {
    console.error("❌ Error al procesar el PDF:", error);
    return '';
  }
}
