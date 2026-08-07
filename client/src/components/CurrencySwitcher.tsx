import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
      <SelectTrigger
        className="w-32 h-8 bg-secondary border-border text-sm"
        data-testid="select-currency"
      >
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
        <SelectItem value="USD">USD (US Dollar)</SelectItem>
        <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
      </SelectContent>
    </Select>
  );
}
