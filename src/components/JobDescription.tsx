
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface JobDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const JobDescription = ({
  value,
  onChange,
  onAnalyze,
  isAnalyzing,
}: JobDescriptionProps) => {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-foreground"
        >
          Descripción del puesto
        </label>
        <Textarea
          id="description"
          placeholder="Describe el puesto de trabajo y los requisitos necesarios..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-32"
        />
      </div>
      <Button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="w-full md:w-auto"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analizando...
          </>
        ) : (
          "Analizar CVs"
        )}
      </Button>
    </div>
  );
};
