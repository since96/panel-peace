import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BuildingIcon } from 'lucide-react';
import { Link } from 'wouter';

interface Bullpen {
  id: number;
  name: string;
  description: string;
  logoUrl: string | null;
  createdAt: string;
  createdBy: number;
  active: boolean;
}

export function SelectStudioDialog() {
  const [open, setOpen] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch available bullpens
  const { data: studios, isLoading } = useQuery<Bullpen[]>({
    queryKey: ['/api/studios'],
    queryFn: async () => {
      const response = await axios.get('/api/studios');
      return response.data;
    },
  });
  
  const handleStudioSelect = (studioId: number) => {
    setOpen(false);
    // Use the regular project creation page
    navigate(`/projects/new?studioId=${studioId}`);
  };
  
  const handleCreateStudio = () => {
    setOpen(false);
    navigate('/studios');
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Comic</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select a Bullpen</DialogTitle>
          <DialogDescription>
            Choose a bullpen for your new comic book. You need to assign every comic to a bullpen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading bullpens...</p>
            </div>
          ) : studios && studios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studios.map((studio) => (
                <Card 
                  key={studio.id} 
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleStudioSelect(studio.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{studio.name}</CardTitle>
                    {studio.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {studio.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BuildingIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-medium">No bullpens available</h3>
              <p className="mt-2 text-sm text-slate-500">You need to create a bullpen first</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateStudio}>
            Create New Bullpen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}