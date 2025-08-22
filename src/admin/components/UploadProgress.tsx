import React from "react";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {progress < 30 && "Validating CSV structure..."}
        {progress >= 30 && progress < 50 && "Processing product data..."}
        {progress >= 50 && progress < 95 && "Uploading to database..."}
        {progress >= 95 && progress < 100 && "Finalizing..."}
        {progress === 100 && "Complete!"}
      </p>
    </div>
  );
};
