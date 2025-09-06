import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="flex items-center justify-center w-full">
            <label
                htmlFor="dropzone-file"
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-cyan-400 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon className="w-10 h-10 mb-4 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-cyan-400">点击上传</span> 或拖放文件
                    </p>
                    <p className="text-xs text-gray-500">支持 MP3, WAV, OGG, FLAC (最大 50MB)</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
            </label>
        </div>
    );
};