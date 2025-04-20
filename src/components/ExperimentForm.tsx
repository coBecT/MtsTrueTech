import React, { useState } from 'react';
import { Calendar, Upload, X } from 'lucide-react';
import FileUpload from './FileUpload';

interface ExperimentFormProps {
  onClose: () => void;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    hypothesis: '',
    startDate: '',
    endDate: '',
    equipment: '',
    budget: '',
  });
  
  const [files, setFiles] = useState<File[]>([]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (uploadedFiles: File[]) => {
    setFiles(prev => [...prev, ...uploadedFiles]);
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would integrate with your API to save the experiment
    console.log('Form submitted:', formData);
    console.log('Files:', files);
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300">
            Название эксперимента
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-300">
            Цель
          </label>
          <textarea
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="hypothesis" className="block text-sm font-medium text-gray-300">
            Гипотеза
          </label>
          <textarea
            id="hypothesis"
            name="hypothesis"
            value={formData.hypothesis}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">
              Дата начала
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">
              Дата окончания
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="mt-1 block w-full pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="equipment" className="block text-sm font-medium text-gray-300">
            Оборудование
          </label>
          <input
            type="text"
            id="equipment"
            name="equipment"
            value={formData.equipment}
            onChange={handleChange}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-300">
            Бюджет
          </label>
          <div className="relative">
            <input
              type="text"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">₽</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Прикрепить файлы
          </label>
          <FileUpload onFileChange={handleFileChange} />
          
          {files.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Прикрепленные файлы:</h4>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <span className="text-sm text-white truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Сохранить
        </button>
      </div>
    </form>
  );
};

export default ExperimentForm;