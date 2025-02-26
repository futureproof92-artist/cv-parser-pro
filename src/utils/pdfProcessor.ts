
import * as pdfjsLib from 'pdfjs-dist';
import { processFileWithVision } from './api';

// Configurar múltiples CDNs como fallback
const CDN_URLS = [
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
];

async function loadPdfWorker(): Promise<void> {
  for (const cdnUrl of CDN_URLS) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
      // Verificar que el worker se carga correctamente
      await fetch(cdnUrl, { method: 'HEAD' });
      console.log("✅ Worker PDF.js cargado desde:", cdnUrl);
      return;
    } catch (error) {
      console.warn(`⚠️ No se pudo cargar worker desde ${cdnUrl}:`, error);
    }
  }
  throw new Error('No se pudo cargar el worker de PDF.js');
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log("📄 Iniciando procesamiento del PDF:", file.name);
    
    await loadPdfWorker();
    
    // Verificar tamaño del archivo
    if (file.size > 10 * 1024 * 1024) {
      console.log("⚠️ Archivo demasiado grande, procesando con OCR");
      return await processFileWithVision(file);
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    });

    console.log("🔍 Cargando documento PDF...");
    const pdf = await loadingTask.promise;
    console.log(`📚 PDF cargado: ${pdf.numPages} páginas`);
    
    let fullText = '';
    const textPromises = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(
        pdf.getPage(i).then(async (page) => {
          try {
            const textContent = await page.getTextContent();
            return textContent.items.map((item: any) => item.str).join(' ');
          } catch (error) {
            console.error(`❌ Error en página ${i}:`, error);
            return '';
          }
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
    return await processFileWithVision(file);
  }
}
