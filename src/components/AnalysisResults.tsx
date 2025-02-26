
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface AnalysisResult {
  fileName: string;
  score: number;
  matches: string[];
}

interface AnalysisResultsProps {
  results: AnalysisResult[];
}

export const AnalysisResults = ({ results }: AnalysisResultsProps) => {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-semibold">Resultados del análisis</h2>
      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card
            key={index}
            className="p-6 transition-all duration-200 hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium truncate">{result.fileName}</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.round(result.score)}% de coincidencia
                </span>
              </div>
              <Progress value={result.score} className="h-2" />
              <div className="flex flex-wrap gap-2">
                {result.matches.map((match, idx) => (
                  <Badge key={idx} variant="secondary">
                    {match}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
