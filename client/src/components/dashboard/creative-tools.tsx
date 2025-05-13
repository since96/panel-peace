import { ToolCard } from '@/components/ui/custom/tool-card';

export function CreativeTools() {
  const tools = [
    {
      title: 'Talent Management',
      description: 'Manage your creative team',
      icon: 'ri-team-line',
      href: '/collaborators',
      color: 'primary'
    },
    {
      title: 'Feedback & Reviews',
      description: 'Review submitted work',
      icon: 'ri-chat-1-line',
      href: '/feedback',
      color: 'secondary'
    },
    {
      title: 'Deadlines & Schedule',
      description: 'Track project timelines',
      icon: 'ri-calendar-line',
      href: '/deadlines',
      color: 'accent'
    },
    {
      title: 'Asset Library',
      description: 'Manage submitted deliverables',
      icon: 'ri-folder-line',
      href: '/asset-library',
      color: 'success'
    }
  ];
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Management Tools</h2>
      
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
