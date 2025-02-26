
import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { JobDescription } from "../components/JobDescription";
import { AnalysisResults } from "../components/AnalysisResults";
import { toast } from "sonner";
import { extractTextFromPdf } from "../utils/pdfProcessor";
import { analyzeTextSimilarity } from "../utils/textAnalysis";

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Caché para almacenar resultados de procesamiento
  const processedCache = new Map<string, string>();

  const handleFilesChange = (newFiles: File[]) => {
    if (newFiles.length > 12) {
      toast.error("Solo se permiten hasta 12 archivos");
      return;
    }
    setFiles(newFiles);
  };

  const handleAnalyze = async () => {
    console.log("🚀 Iniciando análisis de CVs...");
    
    if (files.length === 0) {
      toast.error("Por favor, sube al menos un CV");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Por favor, describe el puesto de trabajo");
      return;
    }

    setAnalyzing(true);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
          let extractedText;

          // Verificar caché
          if (processedCache.has(cacheKey)) {
            console.log(`📋 Usando texto en caché para ${file.name}`);
            extractedText = processedCache.get(cacheKey);
          } else {
            // Procesar nuevo archivo
            extractedText = await extractTextFromPdf(file);
            processedCache.set(cacheKey, extractedText);
          }

          // Analizar similitud
          const analysis = analyzeTextSimilarity(extractedText, jobDescription);

          return {
            fileName: file.name,
            score: analysis.score,
            matches: analysis.matches,
            text: extractedText.substring(0, 200) + "..."
          };
        })
      );

      console.log("✅ Análisis completado");
      setResults(results.sort((a, b) => b.score - a.score));
      toast.success(`${results.length} CVs analizados con éxito`);
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
