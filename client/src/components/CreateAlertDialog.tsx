import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePriceAlert } from "@/hooks/useCryptoData";
import { useToast } from "@/hooks/use-toast";
import type { Cryptocurrency } from "@shared/schema";

interface CreateAlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crypto: Cryptocurrency;
}

export default function CreateAlertDialog({ open, onOpenChange, crypto }: CreateAlertDialogProps) {
    const [alertType, setAlertType] = useState<string>("price_above");
    const [targetValue, setTargetValue] = useState("");
    const createAlert = useCreatePriceAlert();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetValue || isNaN(parseFloat(targetValue))) {
            toast({
                title: "Invalid value",
                description: "Please enter a valid number",
                variant: "destructive"
            });
            return;
        }

        createAlert.mutate(
            {
                cryptoId: crypto.id,
                alertType,
                targetValue
            },
            {
                onSuccess: () => {
                    toast({
                        title: "Alert created",
                        description: `You'll be notified when ${crypto.name} meets your criteria`
                    });
                    setTargetValue("");
                    onOpenChange(false);
                },
                onError: (error) => {
                    toast({
                        title: "Failed to create alert",
                        description: error.message,
                        variant: "destructive"
                    });
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Price Alert</DialogTitle>
                    <DialogDescription>
                        Set an alert for {crypto.name} ({crypto.symbol.toUpperCase()})
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="alert-type">Alert Type</Label>
                            <Select value={alertType} onValueChange={setAlertType}>
                                <SelectTrigger id="alert-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price_above">Price goes above</SelectItem>
                                    <SelectItem value="price_below">Price goes below</SelectItem>
                                    <SelectItem value="percentage_change">24h change exceeds</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="target-value">
                                {alertType === "percentage_change" ? "Percentage (%)" : "Price (USD)"}
                            </Label>
                            <Input
                                id="target-value"
                                type="number"
                                step="any"
                                placeholder={alertType === "percentage_change" ? "5" : "50000"}
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
