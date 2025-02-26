
import * as pdfjsLib from 'pdfjs-dist';
import { processFileWithVision } from './api';

// Inicializar PDF.js worker de manera más robusta
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).href;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log("📄 Intentando extraer texto del PDF:", file.name);
    
    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Cargar el documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
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
      console.log("⚠️ No se pudo extraer texto del PDF, intentando con OCR");
      return await processFileWithVision(file);
    }
    
    console.log("✅ Texto extraído exitosamente");
    return fullText;
  } catch (error) {
    console.error("❌ Error al procesar el PDF:", error);
    try {
      console.log("🔄 Intentando procesar con Vision API después del error...");
      return await processFileWithVision(file);
    } catch (visionError) {
      console.error("❌ Error también con Vision API:", visionError);
      throw new Error("No se pudo procesar el archivo");
    }
  }
}
