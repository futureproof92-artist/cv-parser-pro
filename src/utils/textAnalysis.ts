
interface AnalysisResult {
  score: number;
  matches: string[];
  keywordMatches: { [key: string]: number };
}

export function analyzeTextSimilarity(cvText: string, jobDescription: string): AnalysisResult {
  // Normalizar textos
  const normalizedCV = cvText.toLowerCase();
  const normalizedJob = jobDescription.toLowerCase();

  // Extraer palabras clave del job description
  const keywords = extractKeywords(normalizedJob);
  
  // Calcular coincidencias
  const keywordMatches = calculateKeywordMatches(normalizedCV, keywords);
  
  // Calcular score general
  const score = calculateScore(keywordMatches, keywords.length);
  
  // Generar matches descriptivos
  const matches = generateMatchDescriptions(keywordMatches);

  return {
    score,
    matches,
    keywordMatches
  };
}

function extractKeywords(text: string): string[] {
  // Lista de palabras comunes a ignorar
  const stopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'si', 'para', 'por', 'como', 'de', 'en', 'con']);
  
  // Extraer palabras únicas
  const words = text.split(/\W+/)
    .filter(word => word.length > 2) // Ignorar palabras muy cortas
    .filter(word => !stopWords.has(word)); // Ignorar stop words
  
  return Array.from(new Set(words));
}

function calculateKeywordMatches(cvText: string, keywords: string[]): { [key: string]: number } {
  const matches: { [key: string]: number } = {};
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const count = (cvText.match(regex) || []).length;
    if (count > 0) {
      matches[keyword] = count;
    }
  });
  
  return matches;
}

function calculateScore(matches: { [key: string]: number }, totalKeywords: number): number {
  const matchedKeywords = Object.keys(matches).length;
  const matchScore = (matchedKeywords / totalKeywords) * 100;
  
  // Ajustar score basado en frecuencia de coincidencias
  const frequencyBonus = Object.values(matches).reduce((sum, count) => sum + Math.min(count, 3), 0) * 2;
  
  return Math.min(Math.round(matchScore + frequencyBonus), 100);
}

function generateMatchDescriptions(matches: { [key: string]: number }): string[] {
  const descriptions: string[] = [];
  
  // Agrupar por frecuencia
  const grouped = Object.entries(matches).reduce((acc, [keyword, count]) => {
    const key = count > 2 ? 'high' : count > 1 ? 'medium' : 'low';
    acc[key] = acc[key] || [];
    acc[key].push(keyword);
    return acc;
  }, {} as { [key: string]: string[] });
  
  // Generar descripciones
  if (grouped.high?.length) {
    descriptions.push(`Experiencia destacada en: ${grouped.high.join(', ')}`);
  }
  if (grouped.medium?.length) {
    descriptions.push(`Conocimientos mencionados: ${grouped.medium.join(', ')}`);
  }
  if (grouped.low?.length) {
    descriptions.push(`Menciona también: ${grouped.low.join(', ')}`);
  }
  
  return descriptions;
}
