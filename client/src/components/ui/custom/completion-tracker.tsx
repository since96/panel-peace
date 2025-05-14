import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Check, Link as LinkIcon, Loader2, ExternalLink, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CompletionTrackerProps {
  stepId: number;
  stepType: string;
  currentProgress: number;
  totalCount: number;
  onProgressUpdate: (progress: number) => void;
}

interface FileLink {
  id: number;
  url: string;
  description: string | null;
  workflowStepId: number;
  addedBy: number;
  createdAt: string;
  updatedAt: string;
}

export function CompletionTracker({
  stepId,
  stepType,
  currentProgress,
  totalCount,
  onProgressUpdate
}: CompletionTrackerProps) {
  const { toast } = useToast();
  const [selectedCount, setSelectedCount] = useState<number>(Math.round(currentProgress * totalCount / 100));
  const [fileLink, setFileLink] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [links, setLinks] = useState<FileLink[]>([]);
  const [isAddingLink, setIsAddingLink] = useState<boolean>(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState<boolean>(false);
  
  // Binary completion for plot and script steps
  const isBinaryStep = stepType === 'plot_development' || stepType === 'script';
  
  // Fetch existing file links for this step
  useEffect(() => {
    async function fetchLinks() {
      setIsLoadingLinks(true);
      try {
        const response = await fetch(`/api/workflow-steps/${stepId}/file-links`);
        if (!response.ok) {
          throw new Error('Failed to fetch file links');
        }
        const data = await response.json();
        setLinks(data);
      } catch (error) {
        console.error('Error fetching file links:', error);
      } finally {
        setIsLoadingLinks(false);
      }
    }
    
    fetchLinks();
  }, [stepId]);
  
  // Generate options based on total count
  const generateOptions = () => {
    if (isBinaryStep) {
      return [
        { value: 0, label: "Not Started" },
        { value: 100, label: "Completed" }
      ];
    }
    
    const options = [];
    for (let i = 0; i <= totalCount; i++) {
      const percentage = Math.round((i / totalCount) * 100);
      options.push({
        value: i,
        label: `${i} of ${totalCount} (${percentage}%)`
      });
    }
    return options;
  };
  
  const updateProgress = (count: number) => {
    setSelectedCount(count);
    const newProgress = isBinaryStep ? (count > 0 ? 100 : 0) : Math.round((count / totalCount) * 100);
    onProgressUpdate(newProgress);
  };
  
  const handleAddLink = async () => {
    if (!fileLink) return;
    
    setIsAddingLink(true);
    try {
      // Send the link to the server using the provided mutation
      const apiRequest = await fetch(`/api/workflow-steps/${stepId}/file-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fileLink,
          description: null,
          addedBy: 1 // Default admin user
        }),
      });
      
      if (!apiRequest.ok) {
        throw new Error('Failed to save file link');
      }
      
      // Add the new link to the local state
      setLinks([...links, fileLink]);
      setFileLink("");
      toast({
        title: "Link added",
        description: "File link has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Failed to add link",
        description: "There was an error saving your file link.",
        variant: "destructive"
      });
    } finally {
      setIsAddingLink(false);
    }
  };
  
  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label>Track Completion</Label>
        {isBinaryStep ? (
          <div className="flex items-center mt-2 space-x-2 p-3 border rounded-md">
            <input
              type="checkbox"
              id="completionCheckbox"
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              checked={selectedCount > 0}
              onChange={(e) => updateProgress(e.target.checked ? 1 : 0)}
            />
            <label htmlFor="completionCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">
              {selectedCount > 0 ? "Completed" : "Mark as completed"}
            </label>
          </div>
        ) : (
          <Select
            value={selectedCount.toString()}
            onValueChange={(value) => updateProgress(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select completion" />
            </SelectTrigger>
            <SelectContent>
              {generateOptions().map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div>
        <Label>Add File Link</Label>
        <div className="flex gap-2 mt-1">
          <Input 
            placeholder="Paste file link (Dropbox, Google Drive, etc.)" 
            value={fileLink}
            onChange={(e) => setFileLink(e.target.value)}
          />
          <Button 
            size="sm" 
            onClick={handleAddLink}
            disabled={isAddingLink || !fileLink}
          >
            {isAddingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Add links to files on Dropbox, Google Drive, or similar services
        </p>
      </div>
      
      {links.length > 0 && (
        <div>
          <Label>File Links</Label>
          <div className="space-y-2 mt-1">
            {links.map((link, index) => (
              <Card key={index}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-blue-500" />
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline truncate max-w-[200px]"
                    >
                      {link}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}