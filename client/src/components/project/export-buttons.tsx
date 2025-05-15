import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Download, Send, User, AtSign, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExportButtonsProps {
  projectId: number;
  projectTitle: string;
  workflowSteps: any[]; // Replace with the proper WorkflowStep type
  collaborators: any[]; // Replace with the proper Collaborator type
}

export function ExportButtons({ projectId, projectTitle, workflowSteps, collaborators }: ExportButtonsProps) {
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [apiKeysDialogOpen, setApiKeysDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedCollaborator, setSelectedCollaborator] = useState<number | null>(null);
  const [emailSubject, setEmailSubject] = useState(`Project Schedule: ${projectTitle}`);
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Function to open email dialog and reset state
  const openEmailDialog = () => {
    setRecipientEmail('');
    setSelectedCollaborator(null);
    setEmailSubject(`Project Schedule: ${projectTitle}`);
    setEmailMessage('');
    setEmailDialogOpen(true);
  };

  // Function to download project schedule as PDF
  const downloadPdf = () => {
    try {
      // Create a new PDF document with professional layout
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Define colors
      const primaryColor = [38, 70, 83]; // Dark blue
      const secondaryColor = [42, 157, 143]; // Teal
      const accentColor = [233, 196, 106]; // Gold
      const textColor = [20, 20, 20]; // Near black
      
      // Setup document metadata
      doc.setProperties({
        title: `${projectTitle} - Comic Book Schedule`,
        subject: 'Production Schedule',
        author: 'Comic Editor Pro',
        keywords: 'comic, schedule, production',
        creator: 'Comic Editor Pro'
      });
      
      // Add header with logo/banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 25, 'F');

      // Add title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${projectTitle}`, 105, 15, { align: 'center' });
      
      // Add subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text(`Production Schedule`, 105, 22, { align: 'center' });
      
      // Add date and project info
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 35);

      // Add project summary section
      doc.setFillColor(245, 245, 245);
      doc.rect(15, 40, 180, 25, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Summary', 20, 48);

      // Project details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const totalSteps = workflowSteps.length;
      const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
      const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      
      // Calculate estimated completion date based on workflow steps
      let latestDueDate: Date | null = null;
      workflowSteps.forEach(step => {
        if (step.dueDate) {
          const dueDate = new Date(step.dueDate);
          if (!latestDueDate || dueDate > latestDueDate) {
            latestDueDate = dueDate;
          }
        }
      });
      
      doc.text(`Total Steps: ${totalSteps}`, 20, 55);
      doc.text(`Completed: ${completedSteps} (${progressPercent}%)`, 80, 55);
      doc.text(`Estimated Completion: ${latestDueDate ? latestDueDate.toLocaleDateString() : 'Not set'}`, 150, 55);
      doc.text(`Assignees: ${collaborators.length}`, 20, 62);
      
      // Set up workflow steps table with improved formatting
      const workflowHeaders = [['Step', 'Status', 'Assigned To', 'Due Date', 'Notes']];
      const workflowData = workflowSteps.map(step => [
        step.title,
        step.status.charAt(0).toUpperCase() + step.status.slice(1).replace(/_/g, ' '), // Capitalize and format status
        getAssigneeName(step.assignedTo),
        step.dueDate ? new Date(step.dueDate).toLocaleDateString() : 'Not set',
        step.comments || ''
      ]);
      
      // Draw workflow steps table with better styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Production Workflow', 15, 75);
      
      // Add workflow table
      (doc as any).autoTable({
        startY: 78,
        head: workflowHeaders,
        body: workflowData,
        theme: 'grid',
        headStyles: { 
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Step
          1: { cellWidth: 25, halign: 'center' }, // Status
          2: { cellWidth: 35 }, // Assigned To
          3: { cellWidth: 25, halign: 'center' }, // Due Date
          4: { cellWidth: 'auto' } // Notes
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        didDrawCell: (data: any) => {
          // Highlight cells based on status
          if (data.section === 'body' && data.column.index === 1) {
            const status = data.cell.raw.toLowerCase();
            if (status === 'completed') {
              doc.setFillColor(200, 230, 200); // Light green for completed
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              doc.setTextColor(0, 100, 0);
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
                align: 'center', 
                baseline: 'middle' 
              });
              return false; // Prevent default drawing
            }
            else if (status === 'in progress' || status === 'in_progress') {
              doc.setFillColor(255, 240, 200); // Light yellow for in progress
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              doc.setTextColor(128, 84, 0);
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
                align: 'center', 
                baseline: 'middle' 
              });
              return false; // Prevent default drawing
            }
            else if (status === 'delayed' || status === 'blocked') {
              doc.setFillColor(255, 200, 200); // Light red for delayed/blocked
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              doc.setTextColor(180, 0, 0);
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
                align: 'center', 
                baseline: 'middle' 
              });
              return false; // Prevent default drawing
            }
          }
        }
      });
      
      // Set up talent assignments table with improved formatting
      const talentHeaders = [['Contributor', 'Role', 'Assigned Steps', 'Status', 'Contact']];
      const talentData = collaborators.map(collaborator => [
        collaborator.name || collaborator.fullName || 'Not specified',
        collaborator.role || 'Not specified',
        getAssignedStepsForTalent(collaborator.userId),
        collaborator.availability || 'Not specified',
        collaborator.email || 'No contact info'
      ]);
      
      // Draw talent assignments table with better styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Talent Assignments', 15, (doc as any).lastAutoTable.finalY + 15);
      
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 18,
        head: talentHeaders,
        body: talentData,
        theme: 'grid',
        headStyles: { 
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Name
          1: { cellWidth: 30 }, // Role
          2: { cellWidth: 'auto' }, // Assigned Steps
          3: { cellWidth: 25, halign: 'center' }, // Status
          4: { cellWidth: 35 } // Contact
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
      });
      
      // Add timeline visualization section if space allows
      if ((doc as any).lastAutoTable.finalY < 220) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Production Timeline', 15, (doc as any).lastAutoTable.finalY + 15);
        
        // Draw timeline
        const timelineStartY = (doc as any).lastAutoTable.finalY + 25;
        const timelineWidth = 180;
        
        // Draw timeline axis
        doc.setDrawColor(textColor[0], textColor[1], textColor[2]);
        doc.setLineWidth(0.5);
        doc.line(15, timelineStartY, 15 + timelineWidth, timelineStartY);
        
        // Get the earliest and latest dates from steps
        let earliestDate: Date = new Date();
        let latestDate: Date = new Date();
        
        workflowSteps.forEach(step => {
          if (step.dueDate) {
            const dueDate = new Date(step.dueDate);
            if (dueDate < earliestDate) earliestDate = dueDate;
            if (dueDate > latestDate) latestDate = dueDate;
          }
        });
        
        // Ensure we have at least 30 days span
        const minSpan = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        if (latestDate.getTime() - earliestDate.getTime() < minSpan) {
          latestDate = new Date(earliestDate.getTime() + minSpan);
        }
        
        // Draw timeline points for each step with due date
        workflowSteps.forEach((step, index) => {
          if (step.dueDate) {
            const dueDate = new Date(step.dueDate);
            const timelineProportion = (dueDate.getTime() - earliestDate.getTime()) / 
              (latestDate.getTime() - earliestDate.getTime());
            
            const posX = 15 + (timelineWidth * timelineProportion);
            
            // Draw vertical line for the point
            doc.setLineWidth(0.3);
            doc.line(posX, timelineStartY - 3, posX, timelineStartY + 3);
            
            // Draw circle for the point, color by status
            doc.setDrawColor(textColor[0], textColor[1], textColor[2]);
            if (step.status === 'completed') {
              doc.setFillColor(0, 150, 0); // Green for completed
            } else if (step.status === 'in_progress' || step.status === 'in_progress') {
              doc.setFillColor(255, 180, 0); // Orange for in progress
            } else if (step.status === 'delayed' || step.status === 'blocked') {
              doc.setFillColor(200, 0, 0); // Red for delayed/blocked
            } else {
              doc.setFillColor(100, 100, 100); // Grey for not started
            }
            
            doc.circle(posX, timelineStartY, 2, 'FD');
            
            // Add label below line
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            
            // Alternate labels above and below timeline to avoid overlap
            const labelY = index % 2 === 0 ? timelineStartY + 8 : timelineStartY - 8;
            const textAlign = index % 2 === 0 ? 'center' : 'center';
            const textBaseline = index % 2 === 0 ? 'top' : 'bottom';
            
            doc.text(step.title, posX, labelY, { 
              align: textAlign, 
              maxWidth: 30
            });
            
            // Add date label
            doc.setFontSize(6);
            doc.text(dueDate.toLocaleDateString(), posX, index % 2 === 0 ? labelY + 6 : labelY - 6, { 
              align: textAlign
            });
          }
        });
      }
      
      // Add footer with page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Add colored footer
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 285, 210, 12, 'F');
        
        // Add footer text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by Comic Editor Pro', 15, 292);
        
        // Add page numbers
        doc.text(`Page ${i} of ${pageCount}`, 180, 292);
      }
      
      // Save the PDF
      doc.save(`${projectTitle.replace(/\s+/g, '_')}_Schedule.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "The project schedule PDF has been downloaded.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive"
      });
    }
  };
  
  // Function to send project schedule via email using mailto link
  const sendEmail = () => {
    // Get the final recipient email - either direct input or from selected collaborator
    let finalRecipientEmail = recipientEmail;
    
    // If a collaborator is selected, use their email instead of manual input
    if (selectedCollaborator !== null) {
      const selectedUser = collaborators.find(c => c.userId === selectedCollaborator);
      if (selectedUser && selectedUser.email) {
        finalRecipientEmail = selectedUser.email;
      }
    }
    
    // Validate we have an email address
    if (!finalRecipientEmail) {
      toast({
        title: "Missing Email",
        description: "Please enter a recipient email address or select a collaborator.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Generate plain text version of the schedule
      const textContent = generatePlainTextSchedule();
      
      // Create the mailto link with the schedule content
      const mailtoLink = `mailto:${finalRecipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage + '\n\n' + textContent)}`;
      
      // Open the user's default email client
      window.open(mailtoLink, '_blank');
      
      toast({
        title: "Email Client Opened",
        description: `Your default email client has been opened to send to ${finalRecipientEmail}.`,
      });
      setEmailDialogOpen(false);
    } catch (error) {
      console.error('Email link error:', error);
      toast({
        title: "Email Link Failed",
        description: "There was an error creating the email link. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to send project schedule via server-side SendGrid
  const sendServerEmail = async () => {
    try {
      setIsSending(true);
      
      // Get the final recipient email - either direct input or from selected collaborator
      let finalRecipientEmail = recipientEmail;
      
      // If a collaborator is selected, use their email instead of manual input
      if (selectedCollaborator !== null) {
        const selectedUser = collaborators.find(c => c.userId === selectedCollaborator);
        if (selectedUser && selectedUser.email) {
          finalRecipientEmail = selectedUser.email;
        }
      }
      
      // Validate email address
      if (!finalRecipientEmail) {
        toast({
          title: "Missing Email",
          description: "Please enter a recipient email address or select a collaborator.",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
      
      // Generate the HTML and text content
      const htmlContent = generateEmailHtml();
      const textContent = generatePlainTextSchedule();
      
      // Prepare the email data
      const emailData = {
        projectId,
        to: finalRecipientEmail,
        subject: emailSubject,
        text: emailMessage ? `${emailMessage}\n\n${textContent}` : textContent,
        html: htmlContent
      };
      
      // Send the request to the server endpoint
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email');
      }
      
      toast({
        title: "Email Sent",
        description: `Schedule successfully sent to ${finalRecipientEmail}.`,
      });
      
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error('Server email error:', error);
      
      // Check if the error is due to missing API keys
      if (error.message?.includes('not configured')) {
        // Show the API keys configuration dialog
        setApiKeysDialogOpen(true);
      } else {
        toast({
          title: "Email Failed",
          description: error.message || "There was an error sending the email. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSending(false);
    }
  };
  
  // Generate a plain text version of the schedule for email
  const generatePlainTextSchedule = () => {
    let text = `PROJECT SCHEDULE: ${projectTitle}\n`;
    text += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    text += "WORKFLOW STEPS:\n";
    text += "----------------\n";
    workflowSteps.forEach(step => {
      text += `${step.title} - ${step.status} - Assigned to: ${getAssigneeName(step.assignedTo)}\n`;
      if (step.dueDate) {
        text += `Due: ${new Date(step.dueDate).toLocaleDateString()}\n`;
      }
      text += "\n";
    });
    
    text += "\nTALENT ASSIGNMENTS:\n";
    text += "-------------------\n";
    collaborators.forEach(collaborator => {
      text += `${collaborator.name || 'Not specified'} - Role: ${collaborator.role}\n`;
      text += `Assigned Steps: ${getAssignedStepsForTalent(collaborator.userId)}\n`;
      if (collaborator.availability) {
        text += `Status: ${collaborator.availability}\n`;
      }
      text += "\n";
    });
    
    text += "\nThis schedule was generated by Comic Book Editor";
    
    return text;
  };
  
  // Helper function to get assignee name by ID
  const getAssigneeName = (assigneeId: number | undefined) => {
    if (!assigneeId) return 'Unassigned';
    const collaborator = collaborators.find(c => c.userId === assigneeId);
    return collaborator ? (collaborator.name || collaborator.fullName || 'Unknown') : 'Unknown';
  };
  
  // Helper function to get steps assigned to a talent
  const getAssignedStepsForTalent = (userId: number) => {
    const assignedSteps = workflowSteps.filter(step => step.assignedTo === userId);
    return assignedSteps.map(step => step.title).join(', ') || 'None';
  };
  
  // Generate HTML email content
  const generateEmailHtml = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #333;">Project Schedule: ${projectTitle}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        
        ${emailMessage ? `<div style="margin: 20px 0; padding: 15px; border-left: 4px solid #ccc;">${emailMessage}</div>` : ''}
        
        <h2 style="color: #444; margin-top: 30px;">Workflow Steps</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Step</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Status</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assigned To</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${workflowSteps.map(step => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${step.title}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${step.status}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${getAssigneeName(step.assignedTo)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${step.dueDate ? new Date(step.dueDate).toLocaleDateString() : 'Not set'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2 style="color: #444; margin-top: 30px;">Talent Assignments</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Name</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Role</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Assigned Steps</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${collaborators.map(collaborator => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${collaborator.name || 'Not specified'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${collaborator.role}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${getAssignedStepsForTalent(collaborator.userId)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${collaborator.availability || 'Not specified'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 30px; color: #777; font-size: 12px;">
          This schedule was generated by Comic Book Editor.
        </p>
      </div>
    `;
  };

  // Function to generate iCalendar file for workflow steps
  const downloadCalendar = () => {
    try {
      // Start building the iCalendar content
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Comic Book Editor//Project Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${projectTitle} Schedule`,
        'X-WR-TIMEZONE:UTC',
      ];
      
      // Current time for the DTSTAMP field
      const now = new Date();
      const stampString = formatDateForICS(now);
      
      // Generate unique ID for this calendar
      const calendarUid = `project-${projectId}-${Math.floor(Date.now() / 1000)}`;
      
      // Add each workflow step with a due date as an event
      workflowSteps.forEach((step, index) => {
        if (step.dueDate) {
          const dueDate = new Date(step.dueDate);
          const dueDateString = formatDateForICS(dueDate);
          
          // Create a unique ID for this event
          const eventUid = `${calendarUid}-step-${index}`;
          
          // Add event to calendar
          icsContent = icsContent.concat([
            'BEGIN:VEVENT',
            `UID:${eventUid}@comiceditor.app`,
            `DTSTAMP:${stampString}`,
            `DTSTART:${dueDateString}`,
            `DTEND:${dueDateString}`,
            `SUMMARY:${projectTitle} - ${step.title} Due`,
            `DESCRIPTION:Status: ${step.status}\\nAssigned to: ${getAssigneeName(step.assignedTo)}`,
            'END:VEVENT'
          ]);
        }
      });
      
      // Add the project final due date as an event if it exists
      const projectDueDate = workflowSteps.find(step => step.title.toLowerCase().includes('final'))?.dueDate;
      if (projectDueDate) {
        const dueDate = new Date(projectDueDate);
        const dueDateString = formatDateForICS(dueDate);
        
        icsContent = icsContent.concat([
          'BEGIN:VEVENT',
          `UID:${calendarUid}-final@comiceditor.app`,
          `DTSTAMP:${stampString}`,
          `DTSTART:${dueDateString}`,
          `DTEND:${dueDateString}`,
          `SUMMARY:${projectTitle} - Final Deadline`,
          'DESCRIPTION:Project final deadline',
          'END:VEVENT'
        ]);
      }
      
      // End the calendar
      icsContent.push('END:VCALENDAR');
      
      // Create a blob from the ICS content
      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectTitle.replace(/\s+/g, '_')}_Calendar.ics`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Calendar File Downloaded",
        description: "The schedule has been exported to an iCalendar file. You can import this into Google Calendar, Outlook, or other calendar apps.",
      });
    } catch (error) {
      console.error('Calendar generation error:', error);
      toast({
        title: "Calendar Export Failed",
        description: "There was an error generating the calendar file.",
        variant: "destructive"
      });
    }
  };
  
  // Helper function to format date for iCalendar
  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '').split('T').join('T');
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={openEmailDialog}>
        <Mail className="mr-2 h-4 w-4" />
        Email Schedule
      </Button>
      
      <Button variant="outline" onClick={downloadPdf}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      
      <Button variant="outline" onClick={downloadCalendar}>
        <Calendar className="mr-2 h-4 w-4" />
        Export to Calendar
      </Button>
      
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Project Schedule</DialogTitle>
            <DialogDescription>
              Send the project schedule to collaborators or stakeholders
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">
                  <AtSign className="mr-2 h-4 w-4" />
                  Email Address
                </TabsTrigger>
                <TabsTrigger value="collaborator">
                  <User className="mr-2 h-4 w-4" />
                  Project Collaborator
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Email</Label>
                  <Input
                    id="recipient"
                    placeholder="email@example.com"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      setSelectedCollaborator(null); // Clear collaborator selection
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="collaborator" className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="collaborator">Select Collaborator</Label>
                  <Select
                    value={selectedCollaborator?.toString() || ""}
                    onValueChange={(value) => {
                      const id = parseInt(value);
                      setSelectedCollaborator(id);
                      setRecipientEmail(""); // Clear manual email input
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collaborator" />
                    </SelectTrigger>
                    <SelectContent>
                      {collaborators.map((collaborator) => (
                        <SelectItem 
                          key={collaborator.userId} 
                          value={collaborator.userId.toString()}
                        >
                          {collaborator.name || collaborator.fullName} - {collaborator.email || "No email"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col space-y-2 sm:space-y-0">
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={sendEmail}
                  disabled={isSending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Open Email Client
                </Button>
                
                <Button 
                  type="button" 
                  onClick={sendServerEmail}
                  disabled={isSending || (!recipientEmail && !selectedCollaborator)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send via Server
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              <p>Direct email option opens your email client. Server option requires SendGrid configuration.</p>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* API Keys Configuration Dialog */}
      <Dialog open={apiKeysDialogOpen} onOpenChange={setApiKeysDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Service Configuration</DialogTitle>
            <DialogDescription>
              The SendGrid email service needs to be configured before you can send emails directly from the server.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    To enable server-side email functionality, the following environment variables need to be set:
                  </p>
                  <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                    <li><strong>SENDGRID_API_KEY</strong>: Your SendGrid API key</li>
                    <li><strong>FROM_EMAIL</strong>: The verified email address to send from</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Steps to set up SendGrid:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create a <a href="https://sendgrid.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">SendGrid account</a> if you don't have one</li>
                <li>Generate an API key in the SendGrid dashboard</li>
                <li>Verify a sender email address in SendGrid</li>
                <li>Add the API key and sender email as environment variables in your Replit project</li>
              </ol>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApiKeysDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setApiKeysDialogOpen(false);
                try {
                  // Request the API keys
                  const response = await fetch('/api/request-email-secrets', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    }
                  });
                  
                  if (response.ok) {
                    toast({
                      title: "Request Submitted",
                      description: "Your request for email configuration has been submitted to the administrator.",
                    });
                  } else {
                    throw new Error('Failed to request API keys');
                  }
                } catch (error) {
                  toast({
                    title: "Request Failed",
                    description: "Please contact your administrator to set up the SendGrid API keys.",
                    variant: "destructive"
                  });
                }
              }}
            >
              I'll Set Up Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}