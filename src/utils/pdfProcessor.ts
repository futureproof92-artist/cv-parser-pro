
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { processFileWithVision } from './api';
import { toast } from 'sonner';

// Configurar el worker de PDF.js usando CDN de unpkg
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// Mejorar validación de tipos de archivo
function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf' && file.size > 0 && file.size < 15 * 1024 * 1024;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log("📄 Iniciando validación del PDF:", file.name);

    // Validar archivo antes de procesar
    if (!isValidPDF(file)) {
      throw new Error('Archivo PDF inválido o demasiado grande');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
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
