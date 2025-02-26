
import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { JobDescription } from "../components/JobDescription";
import { AnalysisResults } from "../components/AnalysisResults";
import { toast } from "sonner";
import { extractTextFromPdf } from "../utils/pdfProcessor";

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFilesChange = (newFiles: File[]) => {
    if (newFiles.length > 12) {
      toast.error("Solo se permiten hasta 12 archivos");
      return;
    }
    setFiles(newFiles);
  };

  const handleAnalyze = async () => {
    console.log("🚀 Iniciando análisis de CVs...");
    console.log("📄 Archivos a analizar:", files.map(f => f.name));
    console.log("📝 Descripción del puesto:", jobDescription);

    if (files.length === 0) {
      console.log("❌ Error: No hay archivos para analizar");
      toast.error("Por favor, sube al menos un CV");
      return;
    }
    if (!jobDescription.trim()) {
      console.log("❌ Error: No hay descripción del puesto");
      toast.error("Por favor, describe el puesto de trabajo");
      return;
    }

    console.log("⏳ Comenzando proceso de análisis...");
    setAnalyzing(true);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          // Intentar extraer texto del PDF
          const extractedText = await extractTextFromPdf(file);
          
          if (extractedText) {
            console.log(`✅ Texto extraído con éxito de ${file.name}`);
            // Por ahora, simulamos el score basado en la longitud del texto
            return {
              fileName: file.name,
              score: Math.min((extractedText.length / 1000) * 10, 100), // Simulación de score
              matches: [
                "Texto extraído correctamente",
                `${Math.round(extractedText.length / 100)} párrafos encontrados`,
                "Análisis preliminar completado",
              ],
              text: extractedText.substring(0, 200) + "..." // Primeros 200 caracteres
            };
          } else {
            console.log(`⚠️ No se pudo extraer texto de ${file.name}, se necesita OCR`);
            // Aquí iría la lógica de Google Vision API como fallback
            // Por ahora retornamos un resultado simulado
            return {
              fileName: file.name,
              score: 50, // Score intermedio por defecto
              matches: [
                "Requiere OCR",
                "Pendiente de procesamiento visual",
                "Análisis parcial",
              ],
            };
          }
        })
      );

      console.log("✅ Análisis completado");
      console.log("📊 Resultados:", results);

      setResults(results.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error("❌ Error durante el análisis:", error);
      toast.error("Error al analizar los CVs");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8 animate-fade-in">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">CV Parser Pro</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analiza múltiples CVs y encuentra los candidatos más adecuados para tu
            puesto de trabajo utilizando IA avanzada
          </p>
        </header>

        <main className="max-w-4xl mx-auto space-y-8">
          <FileUploader files={files} onFilesChange={handleFilesChange} />
          <JobDescription
            value={jobDescription}
            onChange={setJobDescription}
            onAnalyze={handleAnalyze}
            isAnalyzing={analyzing}
          />
          {results.length > 0 && <AnalysisResults results={results} />}
        </main>
      </div>
    </div>
  );
};

export default Index;
