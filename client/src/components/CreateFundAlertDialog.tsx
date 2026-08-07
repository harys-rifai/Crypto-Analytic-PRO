import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePriceAlert } from "@/hooks/useCryptoData";
import { useToast } from "@/hooks/use-toast";
import type { MutualFund } from "@shared/schema";

interface CreateFundAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund: MutualFund;
}

export default function CreateFundAlertDialog({ open, onOpenChange, fund }: CreateFundAlertDialogProps) {
  const [alertType, setAlertType] = useState<string>("nav_above");
  const [targetValue, setTargetValue] = useState("");
  const createAlert = useCreatePriceAlert();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetValue || isNaN(parseFloat(targetValue))) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    createAlert.mutate(
      {
        cryptoId: fund.id,
        alertType,
        targetValue,
      },
      {
        onSuccess: () => {
          toast({
            title: "Alert created",
            description: `You'll be notified when ${fund.name} meets your criteria`,
          });
          setTargetValue("");
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast({
            title: "Failed to create alert",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create NAV Alert</DialogTitle>
          <DialogDescription>
            Set an alert for {fund.name} ({fund.symbol})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fund-alert-type">Alert Type</Label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger id="fund-alert-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nav_above">NAV goes above</SelectItem>
                  <SelectItem value="nav_below">NAV goes below</SelectItem>
                  <SelectItem value="percentage_change">Daily change exceeds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fund-target-value">
                {alertType === "percentage_change" ? "Percentage (%)" : "NAV (IDR)"}
              </Label>
              <Input
                id="fund-target-value"
                type="number"
                step="any"
                placeholder={alertType === "percentage_change" ? "5" : "110.00"}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAlert.isPending}>
              {createAlert.isPending ? "Creating..." : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
