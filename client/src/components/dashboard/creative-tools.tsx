import { ToolCard } from '@/components/ui/custom/tool-card';

export function CreativeTools() {
  const tools = [
    {
      title: 'Talent Management',
      description: 'Manage your creative team',
      icon: 'ri-team-line',
      href: '/collaborators',
      color: 'primary'
    }
  ];
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Management Tools</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 max-w-md gap-4">
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
