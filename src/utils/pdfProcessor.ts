
import * as pdfjsLib from 'pdfjs-dist';
import { processFileWithVision } from './api';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log("📄 Iniciando procesamiento del PDF:", file.name);
    
    // Verificar tamaño del archivo
    if (file.size > 10 * 1024 * 1024) {
      console.log("⚠️ Archivo demasiado grande, procesando con OCR");
      return await processFileWithVision(file);
    }

    // Intentar extraer texto del PDF
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });

    console.log("🔍 Cargando documento PDF...");
    const pdf = await loadingTask.promise;
    console.log(`📚 PDF cargado: ${pdf.numPages} páginas`);
    
    let fullText = '';
    const textPromises = [];
    
    // Extraer texto de todas las páginas en paralelo
    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(
        pdf.getPage(i).then(async (page) => {
          const textContent = await page.getTextContent();
          return textContent.items.map((item: any) => item.str).join(' ');
        })
      );
    }
    
    const texts = await Promise.all(textPromises);
    fullText = texts.join('\n');
    
    if (!fullText.trim()) {
      console.log("⚠️ No se encontró texto en el PDF, usando OCR");
      return await processFileWithVision(file);
    }
    
    console.log("✅ Texto extraído exitosamente del PDF");
    return fullText;
  } catch (error) {
    console.error("❌ Error al procesar el PDF:", error);
    try {
      console.log("🔄 Intentando con Vision API...");
      return await processFileWithVision(file);
    } catch (visionError) {
      console.error("❌ Error con Vision API:", visionError);
      throw new Error("No se pudo procesar el archivo");
    }
  }
}
