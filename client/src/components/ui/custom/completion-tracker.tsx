import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Check, Link as LinkIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CompletionTrackerProps {
  stepId: number;
  stepType: string;
  currentProgress: number;
  totalCount: number;
  onProgressUpdate: (progress: number) => void;
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
  const [links, setLinks] = useState<string[]>([]);
  const [isAddingLink, setIsAddingLink] = useState<boolean>(false);
  
  // Binary completion for plot and script steps
  const isBinaryStep = stepType === 'plot_development' || stepType === 'script';
  
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
      // In a real implementation, this would be an API call to save the link
      // For now, we'll just update the local state
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