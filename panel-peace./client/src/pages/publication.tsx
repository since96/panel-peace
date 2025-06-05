import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Download, Save, Share2, Smartphone, Monitor, Tablet, Book, Settings, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Publication() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile" | "print">("desktop");
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };
  
  // In a real app, we would fetch panel layouts, pages, etc. based on the selected project
  
  return (
    <>
      <Helmet>
        <title>Publication Preview - Comic Editor Pro</title>
        <meta name="description" content="Preview your comic book publication in different formats. Prepare your comic for digital and print publication." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Publication Preview</h1>
            <p className="text-slate-500 mt-1">Preview how your comic will appear when published</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[200px]">
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
            
            <div className="hidden md:flex items-center space-x-1 border rounded-md p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${previewDevice === 'desktop' ? 'bg-slate-100' : ''}`}
                onClick={() => setPreviewDevice("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${previewDevice === 'tablet' ? 'bg-slate-100' : ''}`}
                onClick={() => setPreviewDevice("tablet")}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${previewDevice === 'mobile' ? 'bg-slate-100' : ''}`}
                onClick={() => setPreviewDevice("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${previewDevice === 'print' ? 'bg-slate-100' : ''}`}
                onClick={() => setPreviewDevice("print")}
              >
                <Book className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs defaultValue="preview" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="digital">Digital Settings</TabsTrigger>
                <TabsTrigger value="print">Print Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                {selectedProjectId ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {projects?.find(p => p.id.toString() === selectedProjectId)?.title || 'Comic'} {" "}
                          {projects?.find(p => p.id.toString() === selectedProjectId)?.issue || ''}
                        </CardTitle>
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}>-</Button>
                          <span className="text-xs w-12 text-center">{zoomLevel}%</span>
                          <Button variant="outline" size="sm" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}>+</Button>
                        </div>
                      </div>
                      <CardDescription>
                        {previewDevice === 'print' ? 'Print' : 'Digital'} preview - Page 1 of 22
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className={`border rounded-lg flex items-center justify-center bg-slate-100 relative overflow-hidden transition-all duration-300 ${
                          previewDevice === 'mobile' ? 'h-[600px] max-w-[320px]' : 
                          previewDevice === 'tablet' ? 'h-[800px] max-w-[600px]' : 
                          previewDevice === 'print' ? 'h-[800px] max-w-[600px] mx-auto shadow-lg' : 
                          'h-[800px]'
                        }`}
                        style={{
                          margin: '0 auto',
                          transform: `scale(${zoomLevel / 100})`,
                          transformOrigin: 'top center'
                        }}
                      >
                        {/* This would be the actual comic preview in a real application */}
                        {/* Mock layout */}
                        <div className="h-full w-full bg-white p-4 flex flex-col">
                          <div className="text-center mb-8 mt-4">
                            <h2 className="text-3xl font-bold">
                              {projects?.find(p => p.id.toString() === selectedProjectId)?.title || 'Comic Title'}
                            </h2>
                            <p className="text-xl mt-2">
                              {projects?.find(p => p.id.toString() === selectedProjectId)?.issue || 'Issue #X'}
                            </p>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-3 gap-2" style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>
                            <div className="bg-slate-100 col-span-1 row-span-1 border border-slate-300"></div>
                            <div className="bg-slate-100 col-span-1 row-span-1 border border-slate-300"></div>
                            <div className="bg-slate-100 col-span-1 row-span-2 border border-slate-300"></div>
                            <div className="bg-slate-100 col-span-2 row-span-1 border border-slate-300"></div>
                            <div className="bg-slate-100 col-span-3 row-span-1 border border-slate-300"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-3">
                      <div className="flex items-center text-sm text-slate-500">
                        <span>Page 1 of 22</span>
                        <div className="flex ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4 rotate-180" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="text-6xl text-slate-200 mb-4">
                        <i className="ri-book-2-line"></i>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No Project Selected</h3>
                      <p className="text-slate-500 max-w-md mb-6">
                        Select a project to preview how it will appear when published
                      </p>
                      <Select onValueChange={handleProjectChange}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title} {project.issue}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="digital" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Digital Publishing Settings</CardTitle>
                    <CardDescription>Configure settings for digital publication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Digital Platforms</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <Switch id="webtoon" />
                            <Label htmlFor="webtoon">Webtoon</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <Switch id="comixology" defaultChecked />
                            <Label htmlFor="comixology">Comixology</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <Switch id="marvel" />
                            <Label htmlFor="marvel">Marvel Unlimited</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <Switch id="dc" />
                            <Label htmlFor="dc">DC Universe</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Reading Experience</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="reading-mode">Reading Mode</Label>
                            <Select defaultValue="page">
                              <SelectTrigger id="reading-mode">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="page">Page by Page</SelectItem>
                                <SelectItem value="panel">Panel by Panel</SelectItem>
                                <SelectItem value="scroll">Vertical Scroll</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="transition">Page Transition</Label>
                            <Select defaultValue="slide">
                              <SelectTrigger id="transition">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="slide">Slide</SelectItem>
                                <SelectItem value="fade">Fade</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Interactivity</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="sound" />
                            <Label htmlFor="sound">Sound Effects</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="animations" defaultChecked />
                            <Label htmlFor="animations">Animations</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="parallax" />
                            <Label htmlFor="parallax">Parallax Effect</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="zoom" defaultChecked />
                            <Label htmlFor="zoom">Zoom Panels</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline">Reset to Defaults</Button>
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="print" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Print Settings</CardTitle>
                    <CardDescription>Configure settings for print publication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Page Setup</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="page-size">Page Size</Label>
                            <Select defaultValue="standard">
                              <SelectTrigger id="page-size">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard (6.625" × 10.25")</SelectItem>
                                <SelectItem value="digest">Digest (5.5" × 8.5")</SelectItem>
                                <SelectItem value="manga">Manga (5" × 7.5")</SelectItem>
                                <SelectItem value="european">European (8.5" × 11")</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="binding">Binding Type</Label>
                            <Select defaultValue="saddle">
                              <SelectTrigger id="binding">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="saddle">Saddle Stitch</SelectItem>
                                <SelectItem value="perfect">Perfect Binding</SelectItem>
                                <SelectItem value="case">Case Binding</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Print Quality</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="paper-type">Paper Type</Label>
                            <Select defaultValue="glossy">
                              <SelectTrigger id="paper-type">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="glossy">Glossy</SelectItem>
                                <SelectItem value="matte">Matte</SelectItem>
                                <SelectItem value="newsprint">Newsprint</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="cover-type">Cover Type</Label>
                            <Select defaultValue="soft">
                              <SelectTrigger id="cover-type">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="soft">Soft Cover</SelectItem>
                                <SelectItem value="hard">Hard Cover</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Color & Bleed</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="color-mode">Color Mode</Label>
                            <Select defaultValue="cmyk">
                              <SelectTrigger id="color-mode">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cmyk">CMYK</SelectItem>
                                <SelectItem value="rgb">RGB</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label htmlFor="bleed">Bleed (inches)</Label>
                              <span className="text-xs">0.25"</span>
                            </div>
                            <Slider
                              id="bleed"
                              min={0}
                              max={0.5}
                              step={0.05}
                              defaultValue={[0.25]}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Printer Specifications</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="printer-name">Printer Name</Label>
                            <Input id="printer-name" placeholder="Enter printer name" />
                          </div>
                          <div>
                            <Label htmlFor="printer-profile">Printer Profile</Label>
                            <Select defaultValue="default">
                              <SelectTrigger id="printer-profile">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline">Reset to Defaults</Button>
                    <Button>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Preflight Check
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger id="export-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="cbz">CBZ</SelectItem>
                      <SelectItem value="epub">EPUB</SelectItem>
                      <SelectItem value="jpg">JPG Sequence</SelectItem>
                      <SelectItem value="png">PNG Sequence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quality">Image Quality</Label>
                  <div className="flex items-center justify-between mb-1 mt-2">
                    <span className="text-xs">Low</span>
                    <span className="text-xs">High</span>
                  </div>
                  <Slider
                    id="quality"
                    min={0}
                    max={100}
                    step={10}
                    defaultValue={[80]}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 text-right mt-1">80%</p>
                </div>
                
                <div>
                  <Label className="mb-2 block">Additional Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="metadata" defaultChecked />
                      <Label htmlFor="metadata">Include Metadata</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="spreads" />
                      <Label htmlFor="spreads">Export as Spreads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="protect" />
                      <Label htmlFor="protect">Password Protected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="compress" defaultChecked />
                      <Label htmlFor="compress">Compress Output</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full" disabled={!selectedProjectId}>
                  <Download className="h-4 w-4 mr-2" />
                  Export for Publication
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Publishing Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-success/10 text-success flex items-center justify-center mr-2 mt-0.5">
                      <i className="ri-check-line text-xs"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cover image prepared</p>
                      <p className="text-xs text-slate-500">Front and back covers ready</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-success/10 text-success flex items-center justify-center mr-2 mt-0.5">
                      <i className="ri-check-line text-xs"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium">All pages completed</p>
                      <p className="text-xs text-slate-500">22 pages ready for publication</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-warning/10 text-warning flex items-center justify-center mr-2 mt-0.5">
                      <i className="ri-error-warning-line text-xs"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Resolution check</p>
                      <p className="text-xs text-slate-500">Some images below 300 DPI</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center mr-2 mt-0.5">
                      <i className="ri-time-line text-xs text-slate-500"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Final proofreading</p>
                      <p className="text-xs text-slate-500">Check text and layout</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center mr-2 mt-0.5">
                      <i className="ri-time-line text-xs text-slate-500"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Copyright information</p>
                      <p className="text-xs text-slate-500">Add copyright page</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
