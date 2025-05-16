import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, addDays, subDays } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Enum for calculation direction
enum CalculationDirection {
  FORWARD = "forward",
  BACKWARD = "backward"
}

// Enum for distribution method
enum DistributionMethod {
  DISTRIBUTOR = "distributor",
  DIRECT = "direct",
  FULFILLMENT = "fulfillment",
  EVENT = "event"
}

interface TimelineFormData {
  direction: CalculationDirection;
  distributionMethod: DistributionMethod;
  startDate: string; // For forward calculation - completion date
  targetDate: string; // For backward calculation - target in-store date
  printerQueueDays: number;
  printingDays: number;
  shippingDays: number;
  distributorProcessingDays: number; // Only used for distributor
  fulfillmentProcessingDays: number; // Only used for fulfillment center
}

interface TimelineResult {
  completionDate: string;
  printerQueueDate: string;
  printingCompleteDate: string;
  shippingArrivalDate: string;
  inStoreDate: string;
}

export default function DeadlineHelper() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TimelineFormData>({
    direction: CalculationDirection.FORWARD,
    distributionMethod: DistributionMethod.DISTRIBUTOR,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    targetDate: format(new Date(), 'yyyy-MM-dd'),
    printerQueueDays: 7,
    printingDays: 14,
    shippingDays: 5,
    distributorProcessingDays: 7,
    fulfillmentProcessingDays: 3
  });
  
  const [calculationResult, setCalculationResult] = useState<TimelineResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Handle form changes
  const handleChange = (field: keyof TimelineFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Calculate the timeline
  const calculateTimeline = () => {
    let result: TimelineResult;
    
    if (formData.direction === CalculationDirection.FORWARD) {
      // Forward calculation - from completion to in-store
      const completionDate = new Date(formData.startDate);
      const printerQueueDate = addDays(completionDate, formData.printerQueueDays);
      const printingCompleteDate = addDays(printerQueueDate, formData.printingDays);
      const shippingArrivalDate = addDays(printingCompleteDate, formData.shippingDays);
      
      let inStoreDate;
      if (formData.distributionMethod === DistributionMethod.DISTRIBUTOR) {
        inStoreDate = addDays(shippingArrivalDate, formData.distributorProcessingDays);
      } else if (formData.distributionMethod === DistributionMethod.FULFILLMENT) {
        inStoreDate = addDays(shippingArrivalDate, formData.fulfillmentProcessingDays);
      } else {
        // Direct or Event - no additional processing time
        inStoreDate = shippingArrivalDate;
      }
      
      result = {
        completionDate: format(completionDate, 'yyyy-MM-dd'),
        printerQueueDate: format(printerQueueDate, 'yyyy-MM-dd'),
        printingCompleteDate: format(printingCompleteDate, 'yyyy-MM-dd'),
        shippingArrivalDate: format(shippingArrivalDate, 'yyyy-MM-dd'),
        inStoreDate: format(inStoreDate, 'yyyy-MM-dd')
      };
    } else {
      // Backward calculation - from in-store to completion
      const inStoreDate = new Date(formData.targetDate);
      
      let shippingArrivalDate;
      if (formData.distributionMethod === DistributionMethod.DISTRIBUTOR) {
        shippingArrivalDate = subDays(inStoreDate, formData.distributorProcessingDays);
      } else if (formData.distributionMethod === DistributionMethod.FULFILLMENT) {
        shippingArrivalDate = subDays(inStoreDate, formData.fulfillmentProcessingDays);
      } else {
        // Direct or Event - no additional processing time
        shippingArrivalDate = inStoreDate;
      }
      
      const printingCompleteDate = subDays(shippingArrivalDate, formData.shippingDays);
      const printerQueueDate = subDays(printingCompleteDate, formData.printingDays);
      const completionDate = subDays(printerQueueDate, formData.printerQueueDays);
      
      result = {
        completionDate: format(completionDate, 'yyyy-MM-dd'),
        printerQueueDate: format(printerQueueDate, 'yyyy-MM-dd'),
        printingCompleteDate: format(printingCompleteDate, 'yyyy-MM-dd'),
        shippingArrivalDate: format(shippingArrivalDate, 'yyyy-MM-dd'),
        inStoreDate: format(inStoreDate, 'yyyy-MM-dd')
      };
    }
    
    setCalculationResult(result);
    setShowResults(true);
  };
  
  // Get human readable date
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };
  
  // Share results
  const shareResults = () => {
    if (!calculationResult) return;
    
    const directionText = formData.direction === CalculationDirection.FORWARD 
      ? "Forward calculation (completion to in-store)" 
      : "Backward calculation (in-store to completion)";
    
    let distributionText = "";
    switch(formData.distributionMethod) {
      case DistributionMethod.DISTRIBUTOR:
        distributionText = "Distribution through distributor";
        break;
      case DistributionMethod.DIRECT:
        distributionText = "Direct to customers";
        break;
      case DistributionMethod.FULFILLMENT:
        distributionText = "Through fulfillment center";
        break;
      case DistributionMethod.EVENT:
        distributionText = "For an event";
        break;
    }
    
    const shareText = `
Comic Book Timeline Calculator Results:
${directionText}
${distributionText}

Important Dates:
• Completion Date: ${formatDateForDisplay(calculationResult.completionDate)}
• Printer Queue Date: ${formatDateForDisplay(calculationResult.printerQueueDate)}
• Printing Complete: ${formatDateForDisplay(calculationResult.printingCompleteDate)}
• Arrival at ${formData.distributionMethod === DistributionMethod.DISTRIBUTOR ? 'Distributor' : 'Destination'}: ${formatDateForDisplay(calculationResult.shippingArrivalDate)}
• ${formData.distributionMethod === DistributionMethod.DISTRIBUTOR ? 'In-Store Date' : formData.distributionMethod === DistributionMethod.FULFILLMENT ? 'Customer Shipment Date' : 'Availability Date'}: ${formatDateForDisplay(calculationResult.inStoreDate)}

Generated by Comic Editor Pro's Deadline Helper
    `;
    
    try {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Results copied to clipboard",
        description: "The timeline has been copied and is ready to share",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying the text manually",
        variant: "destructive"
      });
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setShowResults(false);
    setCalculationResult(null);
    setCurrentStep(1);
    setFormData({
      direction: CalculationDirection.FORWARD,
      distributionMethod: DistributionMethod.DISTRIBUTOR,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      targetDate: format(new Date(), 'yyyy-MM-dd'),
      printerQueueDays: 7,
      printingDays: 14,
      shippingDays: 5,
      distributorProcessingDays: 7,
      fulfillmentProcessingDays: 3
    });
  };
  
  // Render direction selection
  const renderDirectionStep = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Deadline Helper</CardTitle>
        <CardDescription>Calculate realistic timelines for your comic book project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">What would you like to calculate?</h3>
            <RadioGroup 
              value={formData.direction} 
              onValueChange={(value) => handleChange('direction', value)}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={CalculationDirection.FORWARD} id="forward" />
                <div>
                  <Label htmlFor="forward" className="text-base font-medium">I know when my comic will be completed and need a realistic Street Date</Label>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={CalculationDirection.BACKWARD} id="backward" />
                <div>
                  <Label htmlFor="backward" className="text-base font-medium">I have a target Street Date and need to know when my comic must be completed</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep(2)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render distribution method selection
  const renderDistributionStep = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Distribution Method</CardTitle>
        <CardDescription>How will your comic reach your audience?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Select your distribution method:</h3>
            <RadioGroup 
              value={formData.distributionMethod} 
              onValueChange={(value) => handleChange('distributionMethod', value as DistributionMethod)}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={DistributionMethod.DISTRIBUTOR} id="distributor" />
                <div>
                  <Label htmlFor="distributor" className="text-base font-medium">Comic book distributor</Label>
                  <p className="text-sm text-muted-foreground">Distribution through a traditional comic book distributor to retail stores</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={DistributionMethod.DIRECT} id="direct" />
                <div>
                  <Label htmlFor="direct" className="text-base font-medium">Direct to customers</Label>
                  <p className="text-sm text-muted-foreground">Shipping directly to individual customers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={DistributionMethod.FULFILLMENT} id="fulfillment" />
                <div>
                  <Label htmlFor="fulfillment" className="text-base font-medium">Fulfillment center</Label>
                  <p className="text-sm text-muted-foreground">Shipping to a fulfillment center for crowdfunding or webstore orders</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={DistributionMethod.EVENT} id="event" />
                <div>
                  <Label htmlFor="event" className="text-base font-medium">For an event</Label>
                  <p className="text-sm text-muted-foreground">Shipping to a convention or special event</p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Previous
            </Button>
            <Button onClick={() => setCurrentStep(3)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render date selection and timeline parameters
  const renderParametersStep = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Timeline Parameters</CardTitle>
        <CardDescription>Enter your production and distribution timeframes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key date input */}
          <div className="space-y-3">
            <Label htmlFor="date" className="text-base font-medium">
              {formData.direction === CalculationDirection.FORWARD
                ? "Comic Completion Date"
                : "Target In-Store Date"}
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              {formData.direction === CalculationDirection.FORWARD
                ? "When will your comic be completely finished and ready to send to the printer?"
                : "When do you want your comic to be available to readers?"}
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={formData.direction === CalculationDirection.FORWARD ? formData.startDate : formData.targetDate}
                onChange={(e) => 
                  formData.direction === CalculationDirection.FORWARD
                    ? handleChange('startDate', e.target.value)
                    : handleChange('targetDate', e.target.value)
                }
                className="w-full"
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Timeline parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Production Timeline Parameters</h3>
            
            <div className="space-y-2">
              <Label htmlFor="printerQueueDays" className="text-sm">
                Printer Queue Days
              </Label>
              <p className="text-xs text-muted-foreground">
                How many days does the printer need to get your comic in their queue before approving for press?
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="printerQueueDays"
                  type="number"
                  min="1"
                  value={formData.printerQueueDays}
                  onChange={(e) => handleChange('printerQueueDays', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="whitespace-nowrap">days</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="printingDays" className="text-sm">
                Printing Days
              </Label>
              <p className="text-xs text-muted-foreground">
                How many days does it take the printer to print and ship the books once approved for press?
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="printingDays"
                  type="number"
                  min="1"
                  value={formData.printingDays}
                  onChange={(e) => handleChange('printingDays', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="whitespace-nowrap">days</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingDays" className="text-sm">
                Shipping Days
              </Label>
              <p className="text-xs text-muted-foreground">
                How many days does shipping take to arrive at {
                  formData.distributionMethod === DistributionMethod.DISTRIBUTOR 
                    ? 'the distributor' 
                    : formData.distributionMethod === DistributionMethod.FULFILLMENT
                      ? 'the fulfillment center'
                      : formData.distributionMethod === DistributionMethod.EVENT
                        ? 'the event'
                        : 'customers'
                }?
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="shippingDays"
                  type="number"
                  min="1"
                  value={formData.shippingDays}
                  onChange={(e) => handleChange('shippingDays', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="whitespace-nowrap">days</span>
              </div>
            </div>
            
            {formData.distributionMethod === DistributionMethod.DISTRIBUTOR && (
              <div className="space-y-2">
                <Label htmlFor="distributorProcessingDays" className="text-sm">
                  Distributor Processing Days
                </Label>
                <p className="text-xs text-muted-foreground">
                  How many days does the distributor need from receiving the comics until the street date?
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="distributorProcessingDays"
                    type="number"
                    min="1"
                    value={formData.distributorProcessingDays}
                    onChange={(e) => handleChange('distributorProcessingDays', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="whitespace-nowrap">days</span>
                </div>
              </div>
            )}
            
            {formData.distributionMethod === DistributionMethod.FULFILLMENT && (
              <div className="space-y-2">
                <Label htmlFor="fulfillmentProcessingDays" className="text-sm">
                  Fulfillment Processing Days
                </Label>
                <p className="text-xs text-muted-foreground">
                  How many days does the fulfillment center need from receiving the comics until shipping to customers?
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="fulfillmentProcessingDays"
                    type="number"
                    min="1"
                    value={formData.fulfillmentProcessingDays}
                    onChange={(e) => handleChange('fulfillmentProcessingDays', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="whitespace-nowrap">days</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Previous
            </Button>
            <Button onClick={calculateTimeline}>
              Calculate Timeline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render results
  const renderResults = () => {
    if (!calculationResult) return null;
    
    // Determine terminology based on distribution method
    const destinationText = formData.distributionMethod === DistributionMethod.DISTRIBUTOR 
      ? 'Distributor' 
      : formData.distributionMethod === DistributionMethod.FULFILLMENT
        ? 'Fulfillment Center'
        : formData.distributionMethod === DistributionMethod.EVENT
          ? 'Event'
          : 'Delivery';
          
    const availabilityText = formData.distributionMethod === DistributionMethod.DISTRIBUTOR 
      ? 'In-Store Date' 
      : formData.distributionMethod === DistributionMethod.FULFILLMENT
        ? 'Customer Shipment'
        : formData.distributionMethod === DistributionMethod.EVENT
          ? 'Event Date'
          : 'Customer Availability';
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Timeline Results</CardTitle>
          <CardDescription>
            {formData.direction === CalculationDirection.FORWARD
              ? "Based on your completion date, here's when your comic will be available"
              : "Based on your target date, here's when your comic needs to be completed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-primary/10 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2 text-primary">
                  {formData.direction === CalculationDirection.FORWARD
                    ? "Estimated Availability Date"
                    : "Required Completion Date"}
                </h3>
                <p className="text-2xl font-bold">
                  {formData.direction === CalculationDirection.FORWARD
                    ? formatDateForDisplay(calculationResult.inStoreDate)
                    : formatDateForDisplay(calculationResult.completionDate)}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Complete Timeline</h3>
                
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  <div className="font-medium">Comic Completion:</div>
                  <div>{formatDateForDisplay(calculationResult.completionDate)}</div>
                  
                  <div className="font-medium">Printer Queue:</div>
                  <div>{formatDateForDisplay(calculationResult.printerQueueDate)}</div>
                  
                  <div className="font-medium">Printing Complete:</div>
                  <div>{formatDateForDisplay(calculationResult.printingCompleteDate)}</div>
                  
                  <div className="font-medium">{`${destinationText} Arrival:`}</div>
                  <div>{formatDateForDisplay(calculationResult.shippingArrivalDate)}</div>
                  
                  <div className="font-medium">{availabilityText}:</div>
                  <div>{formatDateForDisplay(calculationResult.inStoreDate)}</div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="text-base font-medium">Timeline Parameters</h3>
                <div className="text-sm space-y-1">
                  <p>• Printer Queue: {formData.printerQueueDays} days</p>
                  <p>• Printing Time: {formData.printingDays} days</p>
                  <p>• Shipping Time: {formData.shippingDays} days</p>
                  {formData.distributionMethod === DistributionMethod.DISTRIBUTOR && (
                    <p>• Distributor Processing: {formData.distributorProcessingDays} days</p>
                  )}
                  {formData.distributionMethod === DistributionMethod.FULFILLMENT && (
                    <p>• Fulfillment Processing: {formData.fulfillmentProcessingDays} days</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetForm}>
                Start Over
              </Button>
              <Button onClick={shareResults} className="bg-primary">
                Share Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>Deadline Helper - Comic Editor Pro</title>
        <meta 
          name="description" 
          content="Calculate realistic timelines for your comic book production and distribution schedule." 
        />
      </Helmet>
      
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Comic Book Deadline Helper</h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            This tool helps you calculate realistic deadlines for your comic book production timeline.
            Whether you're working backward from a target date or forward from a completion date,
            we'll help you plan your schedule.
          </p>
        </div>
        
        {showResults ? (
          renderResults()
        ) : (
          <>
            {currentStep === 1 && renderDirectionStep()}
            {currentStep === 2 && renderDistributionStep()}
            {currentStep === 3 && renderParametersStep()}
          </>
        )}
      </div>
    </>
  );
}