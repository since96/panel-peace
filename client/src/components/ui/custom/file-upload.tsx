import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, File, Image, FileText, Video } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define a structure for file data
export interface FileData {
  file: File;
  url: string;
  size: number;
  type: string;
  name: string;
  tag: 'artwork' | 'script' | 'misc';
}

interface FileUploadProps {
  allowedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (fileData: FileData[]) => void;
}

export function FileUpload({
  allowedTypes = ['image/*', 'application/pdf'],
  maxSize = 10, // 10MB default
  multiple = false,
  onFilesSelected,
  onUploadComplete
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const invalidTypeFiles = files.filter(file => 
      !allowedTypes.some(type => 
        type.includes('*') ? 
          file.type.startsWith(type.split('/*')[0]) : 
          file.type === type
      )
    );
    
    if (invalidTypeFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: `Only ${allowedTypes.join(', ')} files are allowed`,
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Files must be smaller than ${maxSize}MB`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles(prev => multiple ? [...prev, ...files] : files);
    if (onFilesSelected) {
      onFilesSelected(multiple ? [...selectedFiles, ...files] : files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    
    // Simulating upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      // In a real app, you would upload the files to a server here
      // For demo purposes, we're creating URLs and passing file metadata
      
      // Create an array to store our file data
      const fileData = selectedFiles.map(file => {
        return {
          file: file,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
          name: file.name
        };
      });
      
      clearInterval(interval);
      setProgress(100);
      setUploading(false);
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`,
      });
      
      if (onUploadComplete) {
        // Pass the file data to the callback
        onUploadComplete(fileData);
      }
    } catch (error) {
      clearInterval(interval);
      setUploading(false);
      
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the files",
        variant: "destructive"
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (file.type === 'application/pdf') return <FileText className="h-6 w-6" />;
    if (file.type.startsWith('video/')) return <Video className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={allowedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileChange}
        />
        <Upload className="h-10 w-10 text-slate-400 mb-2" />
        <h3 className="text-lg font-medium text-slate-700 mb-1">
          {uploading ? "Uploading..." : "Drag & drop files here"}
        </h3>
        <p className="text-sm text-slate-500 mb-3">
          or click to browse files
        </p>
        <p className="text-xs text-slate-400">
          Allowed types: {allowedTypes.join(', ')} (Max size: {maxSize}MB)
        </p>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {uploading && (
            <Progress value={progress} className="h-2 mb-2" />
          )}
          
          {selectedFiles.map((file, index) => (
            <Card key={index} className="p-3 flex items-center justify-between">
              <div className="flex items-center">
                {getFileIcon(file)}
                <div className="ml-2 text-sm">
                  <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveFile(index)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? `Uploading (${progress}%)` : 'Upload Files'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
