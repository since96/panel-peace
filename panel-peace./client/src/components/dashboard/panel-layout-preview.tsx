import { Button } from '@/components/ui/button';
import { PanelLayout, PanelDefinition } from '@/components/ui/custom/panel-layout';
import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Link } from 'wouter';

export function PanelLayoutPreview() {
  // Sample panel layout
  const [panels] = useState<PanelDefinition[]>([
    { id: '1', colSpan: 1, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
    { id: '2', colSpan: 1, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
    { id: '3', colSpan: 1, rowSpan: 2, style: 'regular', backgroundType: 'artwork' },
    { id: '4', colSpan: 2, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
    { id: '5', colSpan: 1, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
    { id: '6', colSpan: 1, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
    { id: '7', colSpan: 3, rowSpan: 1, style: 'regular', backgroundType: 'artwork' },
  ]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Panel Layout Tool</h2>
          <p className="text-slate-500 mt-1">Design and compose comic page layouts</p>
        </div>
        <Link href="/panel-editor">
          <Button>
            <Edit className="h-4 w-4 mr-1" />
            <span>Open Layout Tool</span>
          </Button>
        </Link>
      </div>
      
      <PanelLayout panels={panels} editable={false} />
    </div>
  );
}
