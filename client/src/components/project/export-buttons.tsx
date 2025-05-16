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
      let yPosition = 20;
      
      // Create the simple formatted PDF similar to email format
      // PROJECT DETAILS
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("----- PROJECT DETAILS -----", 14, yPosition);
      yPosition += 10;

      doc.setFontSize(14);
      doc.text(`PROJECT: ${project.title} ${project.issue || ""}`, 14, yPosition);
      yPosition += 8;
      
      // Description
      if (project.description) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const descriptionLines = doc.splitTextToSize(project.description, 180);
        doc.text(descriptionLines, 14, yPosition);
        yPosition += (descriptionLines.length * 6) + 6;
      }
      
      // WORKFLOW SCHEDULE
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("----- WORKFLOW SCHEDULE -----", 14, yPosition);
      yPosition += 10;
      
      // Add each workflow step
      const workflowSteps = project.workflowSteps || [];
      if (workflowSteps.length > 0) {
        doc.setFontSize(14);
        for (const step of workflowSteps) {
          // Step title in bold
          doc.setFont('helvetica', 'bold');
          doc.text(step.title.toUpperCase(), 14, yPosition);
          yPosition += 7;
          
          // Deadline and status
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          if (step.dueDate) {
            doc.text(`Deadline: ${formatDate(step.dueDate)}`, 14, yPosition);
            yPosition += 6;
          }
          
          const statusText = `Status: ${step.status} (${step.progress}% complete)`;
          doc.text(statusText, 14, yPosition);
          yPosition += 10;
        }
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text("No workflow steps defined.", 14, yPosition);
        yPosition += 10;
      }
      
      // TALENT ROSTER
      yPosition += 5;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("----- TALENT ROSTER -----", 14, yPosition);
      yPosition += 10;
      
      // Separate editors from talents
      const editors = collaborators.filter(c => 
        c.assignmentRole?.toLowerCase().includes('editor'));
      const talents = collaborators.filter(c => 
        !c.assignmentRole?.toLowerCase().includes('editor'));
      
      // Editorial team
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("EDITORIAL TEAM:", 14, yPosition);
      yPosition += 8;
      
      if (editors.length > 0) {
        doc.setFontSize(12);
        for (const editor of editors) {
          const fullName = editor.user?.fullName || "Unknown";
          const role = editor.assignmentRole || "Editor";
          const email = editor.user?.email || "No email";
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${fullName} - ${role}`, 14, yPosition);
          yPosition += 6;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Contact: ${email}`, 14, yPosition);
          yPosition += 10;
        }
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text("No editorial team assigned.", 14, yPosition);
        yPosition += 10;
      }
      
      // Creative team
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("CREATIVE TEAM:", 14, yPosition);
      yPosition += 8;
      
      if (talents.length > 0) {
        doc.setFontSize(12);
        for (const talent of talents) {
          const fullName = talent.user?.fullName || "Unknown";
          const role = talent.assignmentRole || "Contributor";
          const email = talent.user?.email || "No email";
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${fullName} - ${role}`, 14, yPosition);
          yPosition += 6;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Contact: ${email}`, 14, yPosition);
          yPosition += 10;
        }
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text("No creative team assigned.", 14, yPosition);
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
      
      // Create subject line with project title/issue
      const subject = `Comic Project: ${project.title} ${project.issue || ""}`;
      
      // Separate editors from talents
      const editors = collaborators.filter(c => 
        c.assignmentRole?.toLowerCase().includes('editor'));
      const talents = collaborators.filter(c => 
        !c.assignmentRole?.toLowerCase().includes('editor'));
      
      // Create email body formatted as shown in the example screenshot
      let body = `----- PROJECT DETAILS -----

PROJECT: ${project.title} ${project.issue || ""}

${project.description || "No description provided."}

----- WORKFLOW SCHEDULE -----

${project.workflowSteps && project.workflowSteps.length > 0
  ? project.workflowSteps.map((step: any) => 
      `${step.title.toUpperCase()}
Deadline: ${step.dueDate ? formatDate(step.dueDate) : 'No deadline set'}
Status: ${step.status} (${step.progress}% complete)`
    ).join('\n\n')
  : "No workflow steps defined."}

----- TALENT ROSTER -----

EDITORIAL TEAM:
${editors.length > 0 
  ? editors.map(c => {
      const fullName = c.user?.fullName || "Unknown";
      const email = c.user?.email || "No email";
      const role = c.assignmentRole || "Editor";
      return `${fullName} - ${role}
Contact: ${email}`;
    }).join('\n\n')
  : "No editorial team assigned."}

CREATIVE TEAM:
${talents.length > 0 
  ? talents.map(c => {
      const fullName = c.user?.fullName || "Unknown";
      const email = c.user?.email || "No email";
      const role = c.assignmentRole || "Contributor";
      return `${fullName} - ${role}
Contact: ${email}`;
    }).join('\n\n')
  : "No creative team assigned."}
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
                      // Safely access user data
                      const fullName = c.user?.fullName || "Unknown";
                      const role = c.assignmentRole || "Contributor";
                      
                      return (
                        <li key={idx} className="flex justify-between py-1">
                          <span>{fullName}</span>
                          <span className="text-muted-foreground">{role}</span>
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
                .map(c => c.user?.email || '')
                .filter(email => email !== '')
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