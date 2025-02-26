
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const FileUploader = ({ files, onFilesChange }: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf"
      );
      if (pdfFiles.length !== acceptedFiles.length) {
        toast.error("Solo se permiten archivos PDF");
        return;
      }
      onFilesChange([...files, ...pdfFiles].slice(0, 12));
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Arrastra y suelta PDFs aquí, o haz clic para seleccionar archivos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo 12 archivos PDF
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="pdf-preview p-4">
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-sm truncate pr-6">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
