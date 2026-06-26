"use client";

import { useState } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setResult({ success: data.message });
      setFile(null); // Reset after successful upload
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Import Components</h2>
        <p className="text-sm text-text-secondary">Upload an Excel (.xlsx) file to instantly add multiple components to your inventory.</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* Upload Area */}
          <div className="w-full relative group">
            <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-bg/50'}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <FileSpreadsheet className="w-12 h-12 text-primary mb-4" />
                ) : (
                  <UploadCloud className="w-12 h-12 text-text-secondary mb-4 group-hover:text-primary transition-colors" />
                )}
                <p className="mb-2 text-sm font-semibold text-text-primary">
                  {file ? file.name : "Click to select or drag and drop"}
                </p>
                <p className="text-xs text-text-secondary">
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : "Excel files only (.xlsx)"}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Messages */}
          {result?.error && (
            <div className="w-full p-4 bg-danger/10 border border-danger text-danger rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Import Failed</h4>
                <p className="text-xs mt-1">{result.error}</p>
              </div>
            </div>
          )}

          {result?.success && (
            <div className="w-full p-4 bg-success/10 border border-success text-success rounded-md flex items-start gap-3">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Import Successful</h4>
                <p className="text-xs mt-1">{result.success}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-bg font-bold rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload and Import"
            )}
          </button>

        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-bg/50 border border-border rounded-lg p-6">
        <h3 className="font-bold text-text-primary mb-3">How it works</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-text-secondary">
          <li>Ensure your Excel file has standard column names (e.g., <span className="font-mono bg-bg px-1 rounded">Category</span>, <span className="font-mono bg-bg px-1 rounded">Part Name</span>).</li>
          <li>The system will automatically find or create the missing Categories and Subcategories.</li>
          <li>All items will be placed directly into the <span className="font-mono bg-bg px-1 rounded">Store RB_01</span> master location by default.</li>
          <li>Prices, quantities, and minimum alert thresholds will be applied immediately.</li>
        </ul>
      </div>
    </div>
  );
}
