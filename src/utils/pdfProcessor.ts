
import * as pdfjsLib from 'pdfjs-dist';
import { processFileWithVision } from './api';
import { toast } from 'sonner';

// Mejorar validación de tipos de archivo
function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf' && file.size > 0 && file.size < 15 * 1024 * 1024;
}

// Configurar múltiples CDNs como fallback con timeout
const CDN_URLS = [
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
];

async function loadPdfWorker(): Promise<void> {
  let workerLoaded = false;

  for (const cdnUrl of CDN_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
      await fetch(cdnUrl, { 
        method: 'HEAD',
        signal: controller.signal 
      });

      clearTimeout(timeoutId);
      console.log("✅ Worker PDF.js cargado desde:", cdnUrl);
      workerLoaded = true;
      break;
    } catch (error) {
      console.warn(`⚠️ No se pudo cargar worker desde ${cdnUrl}:`, error);
    }
  }

  if (!workerLoaded) {
    throw new Error('No se pudo cargar el worker de PDF.js desde ningún CDN');
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log("📄 Iniciando validación del PDF:", file.name);

    // Validar archivo antes de procesar
    if (!isValidPDF(file)) {
      throw new Error('Archivo PDF inválido o demasiado grande');
    }

    // Intentar cargar el worker con reintentos
    let workerLoadAttempts = 0;
    while (workerLoadAttempts < 3) {
      try {
        await loadPdfWorker();
        break;
      } catch (error) {
        workerLoadAttempts++;
        if (workerLoadAttempts === 3) {
          console.log("⚠️ Fallback a OCR después de fallos en worker");
          return await processFileWithVision(file);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * workerLoadAttempts));
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    });

    // Timeout para la carga del PDF
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout al cargar PDF')), 30000)
    );

    console.log("🔍 Cargando documento PDF...");
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]) as pdfjsLib.PDFDocumentProxy;
    console.log(`📚 PDF cargado: ${pdf.numPages} páginas`);
    
    let fullText = '';
    const textPromises = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(
        pdf.getPage(i).then(async (page) => {
          try {
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .trim();

            if (!pageText) {
              console.log(`⚠️ Página ${i} sin texto, posible imagen`);
            }
            return pageText;
          } catch (error) {
            console.error(`❌ Error en página ${i}:`, error);
            return '';
          }
        })
      );
    }
    
    const texts = await Promise.all(textPromises);
    fullText = texts.join('\n').trim();
    
    if (!fullText) {
      console.log("⚠️ No se encontró texto en el PDF, usando OCR");
      return await processFileWithVision(file);
    }
    
    console.log("✅ Texto extraído exitosamente del PDF");
    return fullText;
  } catch (error) {
    console.error("❌ Error al procesar el PDF:", error);
    toast.error(`Error al procesar ${file.name}: ${error.message}`);
    return await processFileWithVision(file);
  }
}
