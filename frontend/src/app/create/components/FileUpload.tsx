"use client";

import { useState, useRef } from "react";
import { UploadCloud, Link as LinkIcon, FileText, X, File, AlertCircle } from "lucide-react";

interface FileUploadProps {
    onFileSelected: (
        file: File | null,
        url: string,
        method: "file" | "url"
    ) => void;
    disabled?: boolean;
}

export function FileUpload({
    onFileSelected,
    disabled = false,
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState("");
    const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf") {
                setFile(droppedFile);
                onFileSelected(droppedFile, "", "file");
            } else {
                alert("Please upload a PDF file");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                onFileSelected(selectedFile, "", "file");
            } else {
                alert("Please upload a PDF file");
            }
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const url = e.target.value;
        setFileUrl(url);
        onFileSelected(null, url, "url");
    };

    const handleMethodChange = (method: "file" | "url") => {
        if (disabled) return;
        setUploadMethod(method);
        if (method === "file") {
            onFileSelected(file, "", "file");
        } else {
            onFileSelected(null, fileUrl, "url");
        }
    };

    const openFileSelector = () => {
        if (disabled) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemoveFile = () => {
        if (disabled) return;
        setFile(null);
        onFileSelected(null, "", "file");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full font-sans">
            {/* Segmented Control */}
            <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl mb-6">
                <button
                    type="button"
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${uploadMethod === "file"
                        ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleMethodChange("file")}
                    disabled={disabled}
                >
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                </button>
                <button
                    type="button"
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${uploadMethod === "url"
                         ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                         : "text-slate-400 hover:text-white hover:bg-white/5"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleMethodChange("url")}
                    disabled={disabled}
                >
                    <LinkIcon className="w-4 h-4" />
                    Enter URL
                </button>
            </div>

            {uploadMethod === "file" ? (
                <div
                    className={`relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer overflow-hidden
                    ${dragActive
                        ? "border-red-500 bg-red-500/5 scale-[1.02]"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    } 
                    ${file ? "border-emerald-500/50 bg-emerald-500/5" : ""}
                    ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileSelector}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={disabled}
                    />

                    {file ? (
                        <div className="text-center p-6 w-full max-w-sm">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-500">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-white font-medium truncate mb-1" title={file.name}>
                                {file.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            
                            {!disabled && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile();
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                    Remove File
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors 
                                ${dragActive ? "bg-red-500 text-white" : "bg-white/5 text-slate-400"}`}>
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">
                                {dragActive ? "Drop file now" : "Click to upload or drag & drop"}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                                Supports PDF files up to 10MB.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                    <label htmlFor="pdf-url" className="block text-sm font-medium text-slate-300 mb-2">
                        PDF Document URL
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <LinkIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="url"
                            id="pdf-url"
                            value={fileUrl}
                            onChange={handleUrlChange}
                            placeholder="https://example.com/document.pdf"
                            className="block w-full pl-10 pr-3 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all font-mono text-sm"
                            disabled={disabled}
                        />
                    </div>
                     <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                        <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p>Make sure the URL is directly accessible and points to a PDF file.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
