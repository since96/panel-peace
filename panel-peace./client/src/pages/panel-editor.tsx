import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PanelLayout, PanelDefinition } from '@/components/ui/custom/panel-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Project, PanelLayout as PanelLayoutType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Download, Share2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Helmet } from 'react-helmet-async';

export default function PanelEditor() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('');
  const [pageNumber, setPageNumber] = useState<string>('1');
  const [panels, setPanels] = useState<PanelDefinition[]>([]);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: layouts, refetch: refetchLayouts } = useQuery<PanelLayoutType[]>({
    queryKey: ['/api/projects', selectedProjectId, 'panel-layouts'],
    enabled: !!selectedProjectId,
  });

  const savePanelLayoutMutation = useMutation({
    mutationFn: async (layout: PanelLayoutType) => {
      const endpoint = layout.id ? `/api/panel-layouts/${layout.id}` : '/api/panel-layouts';
      const method = layout.id ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, layout);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Layout saved",
        description: "Panel layout has been saved successfully",
      });
      refetchLayouts();
    },
    onError: (error) => {
      toast({
        title: "Error saving layout",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (selectedProjectId && selectedLayoutId && layouts) {
      const layout = layouts.find(l => l.id === parseInt(selectedLayoutId));
      if (layout) {
        // Convert JSON layout to PanelDefinition[]
        setPanels(layout.layout as unknown as PanelDefinition[]);
        setPageNumber(layout.pageNumber.toString());
      }
    }
  }, [selectedProjectId, selectedLayoutId, layouts]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedLayoutId('');
    setPanels([]);
    setPageNumber('1');
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
  };

  const handlePanelChange = (updatedPanels: PanelDefinition[]) => {
    setPanels(updatedPanels);
  };

  const handleAddPanel = () => {
    const newPanel: PanelDefinition = {
      id: uuidv4(),
      colSpan: 1,
      rowSpan: 1,
      style: 'regular',
      backgroundType: 'artwork'
    };
    setPanels([...panels, newPanel]);
  };

  const handleSaveLayout = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    const layoutData = {
      id: selectedLayoutId ? parseInt(selectedLayoutId) : undefined,
      projectId: parseInt(selectedProjectId),
      pageNumber: parseInt(pageNumber),
      layout: panels,
      createdBy: 1, // Using default user
    };

    await savePanelLayoutMutation.mutateAsync(layoutData as PanelLayoutType);
  };

  const handleCreateNewLayout = () => {
    setSelectedLayoutId('');
    setPanels([
      { id: uuidv4(), colSpan: 1, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
      { id: uuidv4(), colSpan: 1, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
      { id: uuidv4(), colSpan: 1, rowSpan: 2, style: 'regular', backgroundType: 'artwork' },
      { id: uuidv4(), colSpan: 2, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
    ]);
    setPageNumber('1');
  };

  return (
    <>
      <Helmet>
        <title>Panel Editor - Comic Editor Pro</title>
        <meta name="description" content="Design and compose comic page layouts with our intuitive panel editor. Create dynamic panel compositions for your comic book projects." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel Layout Editor</h1>
            <p className="text-slate-500 mt-1">Design and compose comic page layouts</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.title} {project.issue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProjectId && (
              <Select value={selectedLayoutId} onValueChange={handleLayoutChange} disabled={!selectedProjectId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">New Layout</SelectItem>
                  {layouts?.map((layout) => (
                    <SelectItem key={layout.id} value={layout.id.toString()}>
                      Page {layout.pageNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button 
              variant={selectedLayoutId ? "outline" : "default"} 
              onClick={handleCreateNewLayout}
              disabled={!selectedProjectId}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Layout
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedProjectId ? 
                      `${projects?.find(p => p.id.toString() === selectedProjectId)?.title || 'Project'} - Page ${pageNumber}`
                      : 'Panel Layout'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1">
                      <Switch
                        id="show-grid"
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                      />
                      <Label htmlFor="show-grid" className="text-xs">Show Grid</Label>
                    </div>
                    <Button 
                      onClick={handleSaveLayout} 
                      disabled={!selectedProjectId || panels.length === 0 || savePanelLayoutMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {selectedProjectId ? 'Design your comic page layout by adding and configuring panels' : 'Select a project to start designing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedProjectId ? (
                  <div className={`border border-slate-200 rounded-lg p-4 ${showGrid ? 'bg-slate-50' : 'bg-white'}`}>
                    <PanelLayout 
                      panels={panels} 
                      onPanelChange={handlePanelChange}
                      editable={true} 
                    />
                    
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" onClick={handleAddPanel}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Panel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl text-slate-200 mb-4">
                      <i className="ri-layout-3-line"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Layout Selected</h3>
                    <p className="text-slate-500 max-w-md mb-6">
                      Select a project and layout to start editing, or create a new layout from scratch.
                    </p>
                    <Button variant="outline" disabled>
                      <Plus className="h-4 w-4 mr-1" />
                      Select a Project First
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Layout Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="page-number">Page Number</Label>
                  <Input
                    id="page-number"
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    disabled={!selectedProjectId}
                  />
                </div>
                
                <div>
                  <Label>Grid Configuration</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Select defaultValue="3">
                        <SelectTrigger>
                          <SelectValue placeholder="Columns" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select defaultValue="row-auto">
                        <SelectTrigger>
                          <SelectValue placeholder="Rows" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="row-3">3 Rows</SelectItem>
                          <SelectItem value="row-4">4 Rows</SelectItem>
                          <SelectItem value="row-auto">Auto Rows</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Page Orientation</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline">Portrait</Button>
                    <Button variant="ghost">Landscape</Button>
                  </div>
                </div>
                
                <div>
                  <Label>Page Size</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (6.625" × 10.25")</SelectItem>
                      <SelectItem value="digest">Digest (5.5" × 8.5")</SelectItem>
                      <SelectItem value="manga">Manga (5" × 7.5")</SelectItem>
                      <SelectItem value="european">European (8.5" × 11")</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Layout
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export as PNG
                </Button>
                {selectedLayoutId && (
                  <Button variant="outline" className="w-full justify-start text-danger">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Layout
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm">
                  3×3 Grid
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  Two-Page Spread
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  Splash Page
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  Action Sequence
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
