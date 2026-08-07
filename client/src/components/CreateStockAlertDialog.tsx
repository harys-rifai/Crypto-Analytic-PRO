import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreatePriceAlert } from "@/hooks/useCryptoData";
import type { Stock } from "@shared/schema";

interface CreateStockAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: Stock;
}

export default function CreateStockAlertDialog({ open, onOpenChange, stock }: CreateStockAlertDialogProps) {
  const [alertType, setAlertType] = useState("price_above");
  const [targetValue, setTargetValue] = useState("");
  const { toast } = useToast();
  const createAlert = useCreatePriceAlert();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetValue || isNaN(parseFloat(targetValue))) {
      toast({
        title: "Invalid target value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    createAlert.mutate(
      {
        cryptoId: stock.id,
        alertType: alertType as any,
        targetValue: targetValue,
      },
      {
        onSuccess: () => {
          toast({
            title: "Alert created",
            description: `Price alert set for ${stock.name}`,
          });
          onOpenChange(false);
          setTargetValue("");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create alert",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Price Alert</DialogTitle>
          <DialogDescription>
            Set a price alert for {stock.name} ({stock.symbol})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alertType">Alert Type</Label>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_above">Price Above</SelectItem>
                <SelectItem value="price_below">Price Below</SelectItem>
                <SelectItem value="percentage_change">Percentage Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetValue">Target Value</Label>
            <Input
              id="targetValue"
              type="number"
              placeholder="Enter target value"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAlert.isPending}>
              {createAlert.isPending ? "Creating..." : "Create Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
