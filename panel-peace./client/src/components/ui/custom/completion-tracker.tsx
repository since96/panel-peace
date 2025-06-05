import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // Force refresh the component with updated totalCount
  console.log(`CompletionTracker initialized with stepId=${stepId}, totalCount=${totalCount}`);
  const [selectedCount, setSelectedCount] = useState<number>(Math.round(currentProgress * totalCount / 100));
  
  // Binary completion for plot and script steps only
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
    // Call the parent component's update function with the new progress percentage
    onProgressUpdate(newProgress);
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
    </div>
  );
}