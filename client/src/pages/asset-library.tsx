import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Asset } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/custom/file-upload";
import { Search, FolderPlus, Filter, Grid, ListFilter, Image, FileText, Video, Pencil, Trash2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

// Sample assets data (in a real app, this would come from the API)
const sampleAssets = [
  { id: 1, name: "Character Sketch - Hero", type: "image/png", projectId: 1, thumbnailUrl: "", createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: "Background - City Street", type: "image/jpeg", projectId: 1, thumbnailUrl: "", createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: "Script Draft v2", type: "application/pdf", projectId: 2, thumbnailUrl: "", createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: "Panel Layout - Page 5", type: "image/png", projectId: 2, thumbnailUrl: "", createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 5, name: "Character Design - Villain", type: "image/png", projectId: 3, thumbnailUrl: "", createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 6, name: "Concept Art - Spaceship", type: "image/jpeg", projectId: 1, thumbnailUrl: "", createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
];

export default function AssetLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Filter assets based on search query, project, and asset type
  const filteredAssets = sampleAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjectId ? asset.projectId === parseInt(selectedProjectId) : true;
    const matchesType = selectedAssetType ? asset.type.startsWith(selectedAssetType) : true;
    return matchesSearch && matchesProject && matchesType;
  });
  
  const getAssetIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (type === 'application/pdf') return <FileText className="h-6 w-6" />;
    if (type.startsWith('video/')) return <Video className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };
  
  return (
    <>
      <Helmet>
        <title>Asset Library - Comic Editor Pro</title>
        <meta name="description" content="Organize and manage all your comic book assets including artwork, scripts, character designs, and more." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Asset Library</h1>
            <p className="text-slate-500 mt-1">Organize and manage your comic book assets</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-64"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon"
                className={viewMode === "grid" ? "bg-slate-100" : ""}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className={viewMode === "list" ? "bg-slate-100" : ""}
                onClick={() => setViewMode("list")}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Project</label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Projects</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.title} {project.issue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Asset Type</label>
                  <Select
                    value={selectedAssetType}
                    onValueChange={setSelectedAssetType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="application/pdf">Documents</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date Added</label>
                  <Select defaultValue="any">
                    <SelectTrigger>
                      <SelectValue placeholder="Any Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="w-full mt-2" onClick={() => {
                  setSelectedProjectId("");
                  setSelectedAssetType("");
                  setSearchQuery("");
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upload Assets</CardTitle>
                <CardDescription>Add new assets to your library</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  allowedTypes={['image/*', 'application/pdf', 'video/*']}
                  multiple={true}
                  maxSize={20}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Images</span>
                      <span className="text-sm font-medium">245 MB</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Documents</span>
                      <span className="text-sm font-medium">78 MB</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Videos</span>
                      <span className="text-sm font-medium">120 MB</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Used</span>
                      <span className="text-sm font-bold">443 MB / 2 GB</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-success rounded-full" style={{ width: '22%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-5">
                <TabsTrigger value="all">All Files</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                {viewMode === "grid" ? (
                  filteredAssets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredAssets.map((asset) => (
                        <Card key={asset.id} className="overflow-hidden">
                          <div className="h-40 bg-slate-100 flex items-center justify-center border-b">
                            {asset.type.startsWith('image/') ? (
                              <div className="text-5xl text-slate-300">
                                <i className="ri-image-line"></i>
                              </div>
                            ) : asset.type === 'application/pdf' ? (
                              <div className="text-5xl text-slate-300">
                                <i className="ri-file-text-line"></i>
                              </div>
                            ) : (
                              <div className="text-5xl text-slate-300">
                                <i className="ri-file-line"></i>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(asset.updatedAt).toLocaleDateString()}
                            </p>
                            <div className="flex mt-2 justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-sm">
                      <div className="text-4xl text-slate-300 mb-3">
                        <i className="ri-file-search-line"></i>
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">No assets found</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Try adjusting your filters or upload new assets
                      </p>
                      <Button>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Upload New Assets
                      </Button>
                    </div>
                  )
                ) : (
                  filteredAssets.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm">
                      {filteredAssets.map((asset, index) => (
                        <div key={asset.id} className={`flex items-center p-3 ${index !== 0 ? 'border-t border-slate-100' : ''}`}>
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center mr-3">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">{asset.name}</h3>
                            <p className="text-xs text-slate-500">
                              {new Date(asset.updatedAt).toLocaleDateString()} • 
                              {asset.type.split('/')[1].toUpperCase()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-sm">
                      <div className="text-4xl text-slate-300 mb-3">
                        <i className="ri-file-search-line"></i>
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">No assets found</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Try adjusting your filters or upload new assets
                      </p>
                      <Button>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Upload New Assets
                      </Button>
                    </div>
                  )
                )}
              </TabsContent>
              
              <TabsContent value="images" className="mt-4">
                <div className="py-24 text-center">
                  <p className="text-slate-500">Same as "All Files" but filtered to show only images</p>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-4">
                <div className="py-24 text-center">
                  <p className="text-slate-500">Same as "All Files" but filtered to show only documents</p>
                </div>
              </TabsContent>
              
              <TabsContent value="videos" className="mt-4">
                <div className="py-24 text-center">
                  <p className="text-slate-500">Same as "All Files" but filtered to show only videos</p>
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-4">
                <div className="py-24 text-center">
                  <p className="text-slate-500">Same as "All Files" but sorted by most recent</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
