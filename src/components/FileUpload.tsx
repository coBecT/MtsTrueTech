import React, { useRef, useState } from 'react';
import { Upload, FileText, Image, FilePieChart } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onFileChange(fileArray);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragging(true);
    } else if (e.type === 'dragleave') {
      setDragging(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files);
      onFileChange(fileArray);
      e.dataTransfer.clearData();
    }
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-6 w-6 text-blue-400" />;
    if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        type === 'application/vnd.ms-excel') return <FilePieChart className="h-6 w-6 text-green-400" />;
    return <FileText className="h-6 w-6 text-gray-400" />;
  };
  
  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center ${
          dragging ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-gray-600'
        }`}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm text-gray-300 text-center">
          <span className="font-medium text-blue-400">Нажмите для загрузки</span> или перетащите файлы сюда
        </p>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Поддерживаются фото, документы Word, файлы Excel
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
      
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-center p-2 rounded bg-gray-700">
          {getFileIcon('image/jpeg')}
          <span className="ml-2 text-xs text-gray-300">Фото (.jpg, .png)</span>
        </div>
        <div className="flex items-center p-2 rounded bg-gray-700">
          {getFileIcon('application/pdf')}
          <span className="ml-2 text-xs text-gray-300">Документы (.docx, .pdf)</span>
        </div>
        <div className="flex items-center p-2 rounded bg-gray-700">
          {getFileIcon('application/vnd.ms-excel')}
          <span className="ml-2 text-xs text-gray-300">Таблицы (.xlsx)</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;