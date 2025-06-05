import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface PanelDefinition {
  id: string;
  colSpan: number;
  rowSpan: number;
  style: 'regular' | 'borderless' | 'circular' | 'diagonal';
  backgroundType: 'artwork' | 'color';
}

interface PanelLayoutProps {
  panels: PanelDefinition[];
  onPanelChange?: (panels: PanelDefinition[]) => void;
  editable?: boolean;
}

export function PanelLayout({ panels, onPanelChange, editable = true }: PanelLayoutProps) {
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  
  const handlePanelClick = (panelId: string) => {
    if (!editable) return;
    setSelectedPanelId(panelId);
  };
  
  const getSelectedPanel = () => {
    return panels.find(panel => panel.id === selectedPanelId);
  };
  
  const updatePanelProperty = (property: keyof PanelDefinition, value: any) => {
    if (!selectedPanelId || !onPanelChange) return;
    
    const updatedPanels = panels.map(panel => {
      if (panel.id === selectedPanelId) {
        return { ...panel, [property]: value };
      }
      return panel;
    });
    
    onPanelChange(updatedPanels);
  };
  
  const selectedPanel = getSelectedPanel();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="panel-grid">
            {panels.map((panel) => (
              <div
                key={panel.id}
                className={cn(
                  "panel",
                  panel.id === selectedPanelId ? "border-primary border-solid" : "border-dashed",
                  panel.style === 'borderless' && "border-0",
                  panel.style === 'circular' && "rounded-full",
                  panel.style === 'diagonal' && "transform -rotate-6"
                )}
                style={{
                  gridColumn: `span ${panel.colSpan}`,
                  gridRow: `span ${panel.rowSpan}`,
                  backgroundColor: panel.backgroundType === 'color' ? '#f8fafc' : 'transparent'
                }}
                onClick={() => handlePanelClick(panel.id)}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {editable && (
        <div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 h-full">
            <h3 className="font-medium text-slate-900 mb-3">Panel Properties</h3>
            
            {selectedPanel ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-500 block mb-1">Width (columns)</Label>
                  <Select 
                    value={selectedPanel.colSpan.toString()}
                    onValueChange={(value) => updatePanelProperty('colSpan', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-slate-500 block mb-1">Height (rows)</Label>
                  <Select 
                    value={selectedPanel.rowSpan.toString()}
                    onValueChange={(value) => updatePanelProperty('rowSpan', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-slate-500 block mb-1">Panel Style</Label>
                  <Select 
                    value={selectedPanel.style}
                    onValueChange={(value) => updatePanelProperty('style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="borderless">Borderless</SelectItem>
                      <SelectItem value="circular">Circular</SelectItem>
                      <SelectItem value="diagonal">Diagonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-slate-500 block mb-1">Background Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedPanel.backgroundType === 'artwork' ? 'outline' : 'ghost'}
                      onClick={() => updatePanelProperty('backgroundType', 'artwork')}
                      className={selectedPanel.backgroundType === 'artwork' ? 'border-primary text-primary' : ''}
                    >
                      Artwork
                    </Button>
                    <Button
                      variant={selectedPanel.backgroundType === 'color' ? 'outline' : 'ghost'}
                      onClick={() => updatePanelProperty('backgroundType', 'color')}
                      className={selectedPanel.backgroundType === 'color' ? 'border-primary text-primary' : ''}
                    >
                      Color Fill
                    </Button>
                  </div>
                </div>
                
                <div className="pt-3 mt-3 border-t border-slate-200">
                  <Button className="w-full">Apply Changes</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a panel to edit its properties</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
