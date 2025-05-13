import { ToolCard } from '@/components/ui/custom/tool-card';

export function CreativeTools() {
  const tools = [
    {
      title: 'Panel Layout',
      description: 'Design page compositions',
      icon: 'ri-layout-3-line',
      href: '/panel-editor',
      color: 'primary'
    },
    {
      title: 'Script Editor',
      description: 'Write and review scripts',
      icon: 'ri-file-text-line',
      href: '/script-editor',
      color: 'secondary'
    },
    {
      title: 'Feedback System',
      description: 'Review and annotate artwork',
      icon: 'ri-chat-1-line',
      href: '/feedback',
      color: 'accent'
    },
    {
      title: 'Publication Preview',
      description: 'See how comics will appear',
      icon: 'ri-book-2-line',
      href: '/publication',
      color: 'success'
    }
  ];
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Creative Tools</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <ToolCard
            key={tool.title}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            href={tool.href}
            color={tool.color as any}
          />
        ))}
      </div>
    </div>
  );
}
