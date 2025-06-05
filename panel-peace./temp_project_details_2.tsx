          <DialogHeader>
            <DialogTitle>Adjust Deadline</DialogTitle>
            <DialogDescription>
              Update the deadline for this workflow step.
            </DialogDescription>
          </DialogHeader>
          
          {editingStep && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="step-title-deadline" className="text-right">
                  Step
                </Label>
                <Input
                  id="step-title-deadline"
                  value={editingStep.title}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-deadline" className="text-right">
                  Current Deadline
                </Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {editingStep.dueDate 
                      ? format(new Date(editingStep.dueDate), 'PPP') 
                      : 'No deadline set'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-deadline" className="text-right">
                  New Deadline
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="justify-start text-left font-normal w-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingStep.dueDate 
                          ? format(new Date(editingStep.dueDate), 'PPP') 
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingStep.dueDate ? new Date(editingStep.dueDate) : undefined}
                        onSelect={(date) => setEditingStep({...editingStep, dueDate: date || null})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeadlineDialog(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingStep) {
                  const updateData = {
                    stepId: editingStep.id,
                    dueDate: editingStep.dueDate
                  };
                  updateWorkflowStepMutation.mutate(updateData);
                  setShowDeadlineDialog(false);
                }
              }}
              disabled={updateWorkflowStepMutation.isPending}
            >
              {updateWorkflowStepMutation.isPending ? "Updating..." : "Update Deadline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateStatusDialog} onOpenChange={setShowUpdateStatusDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Step Status</DialogTitle>
            <DialogDescription>
              Quickly update the status of this workflow step.
            </DialogDescription>
          </DialogHeader>
          
          {editingStep && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quick-status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={editingStep.status}
                  onValueChange={(value) => setEditingStep({...editingStep, status: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quick-progress" className="text-right">
                  Progress
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <Slider
                      id="quick-progress"
                      min={0}
                      max={100}
                      step={5}
                      value={[editingStep.progress]}
                      onValueChange={(value) => setEditingStep({...editingStep, progress: value[0]})}
                      className="flex-1"
                    />
                    <span>{editingStep.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUpdateStatusDialog(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingStep) {
                  const updateData = {
                    stepId: editingStep.id,
                    status: editingStep.status,
                    progress: editingStep.progress
                  };
                  updateWorkflowStepMutation.mutate(updateData);
                  setShowUpdateStatusDialog(false);
                }
              }}
              disabled={updateWorkflowStepMutation.isPending}
            >
              {updateWorkflowStepMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload files related to this workflow step.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStep && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Uploading files for: {selectedStep.title}</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Files will be associated with this workflow step and visible to the editorial team.
                </p>
              </div>
              
              <FileUpload 
                allowedTypes={['image/jpeg', 'image/png', 'application/pdf', 'application/postscript']}
                maxSize={25}
                multiple={true}
                onUploadComplete={(fileDataArray) => {
                  // Create file upload entries in the database
                  if (selectedStep && fileDataArray.length > 0) {
                    fileDataArray.forEach(fileData => {
                      // Create file upload object with required fields matching the schema
                      const fileUpload = {
                        projectId: parseInt(id as string),
                        workflowStepId: selectedStep.id,
                        fileName: fileData.name,
                        originalName: fileData.name,
                        fileSize: fileData.size,
                        mimeType: fileData.type,
                        filePath: fileData.url,
                        thumbnailPath: fileData.url,
                        uploadedBy: DEFAULT_USER_ID,
                        version: 1,
                        status: 'pending_review',
                        fileTag: fileData.tag,
                      };
                      
                      // Submit to API
                      apiRequest('POST', '/api/file-uploads', fileUpload)
                        .then(() => {
                          toast({
                            title: "File uploaded",
                            description: "File has been uploaded successfully"
                          });
                        })
                        .catch(error => {
                          toast({
                            title: "Upload failed",
                            description: error.message || "Failed to save file metadata",
                            variant: "destructive"
                          });
                        });
                    });
                    
                    setShowUploadDialog(false);
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editorial Comments</DialogTitle>
            <DialogDescription>
              {selectedStep ? `Comments for "${selectedStep.title}" step` : 'Add internal comments for the editorial team.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="comment" className="text-sm font-medium">Add New Comment</Label>
              <Textarea 
                id="comment"
                placeholder="Add comment for editorial team (not shared with talent)"
                className="mt-2"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!selectedStep}
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Previous Comments</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {users?.find(user => user.id === comment.userId)?.username?.substring(0, 2).toUpperCase() || 'ED'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {users?.find(user => user.id === comment.userId)?.username || 'Editor'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDateRelative(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-slate-500 py-4">
                    No comments yet. Be the first to add one!
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddComment}
              disabled={!selectedStep || !commentText.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? "Posting..." : "Add Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
