import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Mail, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ProjectEditor {
  id: number;
  projectId: number;
  userId: number;
  assignedBy: number | null;
  assignmentRole: string | null;
  accessLevel: string | null;
  user?: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string | null;
  };
}

export interface ExportButtonsProps {
  project: any;
  collaborators: ProjectEditor[];
}

export function ExportButtons({ project, collaborators }: ExportButtonsProps) {
  const { toast } = useToast();
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Function to generate PDF
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`${project.title} ${project.issue || ""}`, 14, 22);
      
      // Add project info
      doc.setFontSize(12);
      doc.text(`Status: ${project.status}`, 14, 32);
      doc.text(`Created: ${formatDate(project.createdAt)}`, 14, 38);
      if (project.dueDate) {
        doc.text(`Due: ${formatDate(project.dueDate)}`, 14, 44);
      }
      
      doc.text(`Description:`, 14, 54);
      const descriptionLines = doc.splitTextToSize(project.description || "No description provided.", 180);
      doc.text(descriptionLines, 14, 60);
      
      let yPosition = 60 + (descriptionLines.length * 6);
      
      // Add collaborators section
      if (collaborators && collaborators.length > 0) {
        yPosition += 10;
        doc.setFontSize(16);
        doc.text("Team Members", 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        // Define the table data
        const tableData = collaborators.map(c => {
          const user = c.user || { fullName: "Unknown", email: "Unknown" };
          return [
            user.fullName || "Unknown",
            c.assignmentRole || "Contributor",
            user.email || "No email"
          ];
        });
        
        // Add the table
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Name', 'Role', 'Email']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { fontSize: 10 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Add workflow steps if available
      if (project.workflowSteps && project.workflowSteps.length > 0) {
        doc.setFontSize(16);
        doc.text("Workflow Steps", 14, yPosition);
        yPosition += 10;
        
        const workflowTableData = project.workflowSteps.map((step: any) => [
          step.title,
          step.status,
          `${step.progress}%`,
          step.dueDate ? formatDate(step.dueDate) : 'No deadline'
        ]);
        
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Step', 'Status', 'Progress', 'Due Date']],
          body: workflowTableData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { fontSize: 10 }
        });
      }
      
      // Save the PDF
      doc.save(`${project.title.replace(/\s+/g, '_')}_${project.issue || "details"}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Project details saved as PDF",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error creating the PDF",
        variant: "destructive",
      });
    }
  };

  // Function to prepare email
  const prepareEmail = () => {
    setShowEmailDialog(true);
  };

  // Function to send email with project details
  const sendEmail = (recipients: string) => {
    try {
      // Format recipients
      const emailList = recipients.split(',').map(email => email.trim());
      
      // Create subject line
      const subject = `Comic Project Details: ${project.title} ${project.issue || ""}`;
      
      // Create email body
      let body = `
Project: ${project.title} ${project.issue || ""}
Status: ${project.status}
${project.dueDate ? `Due Date: ${formatDate(project.dueDate)}\n` : ''}

${project.description || "No description provided."}

Team Members:
${collaborators && collaborators.length > 0 
  ? collaborators.map(c => {
      const user = c.user || { fullName: "Unknown", email: "Unknown" };
      return `- ${user.fullName || "Unknown"} (${c.assignmentRole || "Contributor"}): ${user.email || "No email"}`;
    }).join('\n')
  : "No team members assigned."}

Workflow Status:
${project.workflowSteps && project.workflowSteps.length > 0
  ? project.workflowSteps.map((step: any) => 
      `- ${step.title}: ${step.status} (${step.progress}% complete)${step.dueDate ? ` - Due: ${formatDate(step.dueDate)}` : ''}`
    ).join('\n')
  : "No workflow steps defined."}
`;

      // Create mailto URL
      const mailtoLink = `mailto:${emailList.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open email client
      window.open(mailtoLink, '_blank');
      
      setShowEmailDialog(false);
      
      toast({
        title: "Email Prepared",
        description: "Project details ready to email from your mail client",
      });
    } catch (error) {
      console.error("Email preparation error:", error);
      toast({
        title: "Email Preparation Failed",
        description: "There was an error preparing the email",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={generatePDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={prepareEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Share via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Project via Email</DialogTitle>
            <DialogDescription>
              This will open your default email client with project details
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {project.title} {project.issue} 
              <Badge variant="outline">{project.status}</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {project.description || "No description provided."}
            </p>
            
            <div className="mt-4">
              <h4 className="font-medium">Team Members:</h4>
              <ul className="mt-1 text-sm">
                {collaborators && collaborators.length > 0 
                  ? collaborators.map((c, idx) => {
                      const user = c.user || { fullName: "Unknown", email: "Unknown" };
                      return (
                        <li key={idx} className="flex justify-between py-1">
                          <span>{user.fullName || "Unknown"}</span>
                          <span className="text-muted-foreground">{c.assignmentRole || "Contributor"}</span>
                        </li>
                      );
                    })
                  : <li className="text-muted-foreground">No team members assigned.</li>
                }
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              // For demonstration, we'll use a default list of recipients
              // In a real app, you might have a form here to collect email addresses
              const defaultRecipients = collaborators
                ?.filter(c => c.user?.email)
                .map(c => c.user.email)
                .join(',') || '';
              
              sendEmail(defaultRecipients);
            }}>
              <Mail className="h-4 w-4 mr-2" />
              Open Email Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}