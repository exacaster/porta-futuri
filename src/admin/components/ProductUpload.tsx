import React, { useState, useCallback, useRef } from 'react';
// import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { csvProcessor } from '../../widget/services/csvParser';
import { UploadProgress } from './UploadProgress';

interface ProductUploadProps {
  supabase: any;
  onUploadComplete?: (batchId: string) => void;
}

export const ProductUpload: React.FC<ProductUploadProps> = ({ supabase, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const csvFile = event.target.files?.[0];
    if (csvFile && csvFile.type === 'text/csv') {
      setFile(csvFile);
      setErrors([]);
      setSuccess(false);
      setStats(null);
    } else if (csvFile) {
      setErrors(['Please upload a valid CSV file']);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setErrors([]);

    try {
      // Step 1: Validate CSV structure
      setProgress(10);
      const validation = await csvProcessor.validateCSVStructure(file, [
        'product_id', 'name', 'category', 'price', 'description'
      ]);

      if (!validation.valid) {
        setErrors(validation.errors);
        setUploading(false);
        return;
      }

      // Step 2: Process CSV
      setProgress(30);
      const result = await csvProcessor.processProductCSV(file);

      if (result.errors.length > 0) {
        // Show first 10 errors
        const errorMessages = result.errors.slice(0, 10).map(
          err => `Row ${err.row}: ${err.message}`
        );
        if (result.errors.length > 10) {
          errorMessages.push(`... and ${result.errors.length - 10} more errors`);
        }
        setErrors(errorMessages);
      }

      // Step 3: Calculate file hash for deduplication
      setProgress(50);
      const fileHash = await csvProcessor.calculateFileHash(file);

      // Step 4: Create upload batch
      const { data: batch, error: batchError } = await supabase
        .from('product_upload_batches')
        .insert({
          filename: file.name,
          file_hash: fileHash,
          total_products: result.data.length,
          successful_products: 0,
          failed_products: 0,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Step 5: Upload products in chunks
      const products = result.data;
      const chunkSize = 100;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const progressValue = 50 + ((i / products.length) * 40);
        setProgress(Math.round(progressValue));

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        
        // Transform products for database
        const dbProducts = chunk.map(product => ({
          ...product,
          upload_batch_id: batch.id,
          uploaded_by: userData.user?.id
        }));

        const { error: insertError } = await supabase
          .from('products')
          .upsert(dbProducts, { onConflict: 'product_id' });

        if (insertError) {
          failCount += chunk.length;
          console.error('Insert error:', insertError);
        } else {
          successCount += chunk.length;
        }
      }

      // Step 6: Update batch status
      setProgress(95);
      await supabase
        .from('product_upload_batches')
        .update({
          successful_products: successCount,
          failed_products: failCount,
          status: 'completed',
          completed_at: new Date().toISOString(),
          errors: result.errors
        })
        .eq('id', batch.id);

      setProgress(100);
      setSuccess(true);
      setStats({
        total: products.length,
        successful: successCount,
        failed: failCount
      });

      if (onUploadComplete) {
        onUploadComplete(batch.id);
      }

      // Clear file after successful upload
      setTimeout(() => {
        setFile(null);
        setProgress(0);
      }, 3000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrors([`Upload failed: ${error.message}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          border-gray-300 hover:border-gray-400
          ${file ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {file ? (
          <div className="space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setSuccess(false);
                setStats(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-lg">Click to upload a CSV file</p>
            <p className="text-sm text-gray-500">or drag & drop your file here</p>
            <p className="text-xs text-gray-400">Maximum file size: 50MB</p>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Upload Errors</p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {success && stats && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Upload Successful!</p>
              <p className="mt-1 text-sm text-green-700">
                Processed {stats.total} products: {stats.successful} successful, {stats.failed} failed
              </p>
            </div>
          </div>
        </div>
      )}

      {file && !uploading && !success && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90"
        >
          Upload Products
        </button>
      )}

      {uploading && (
        <UploadProgress progress={progress} />
      )}
    </div>
  );
};