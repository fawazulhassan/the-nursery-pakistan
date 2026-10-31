import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getActiveSitewidePercent,
  karachiInputToUtcIso,
  parseSitewideSale,
  utcIsoToKarachiInput,
  type SitewideSale,
} from "@/lib/productSale";

const PERCENT_OPTIONS = Array.from({ length: 100 }, (_, index) => String(index + 1));

const emptySale = {
  name: "",
  percentage: "20",
  startsAt: "",
  endsAt: "",
  enabled: false,
};

export default function SitewideSaleCard() {
  const { toast } = useToast();
  const [name, setName] = useState(emptySale.name);
  const [percentage, setPercentage] = useState(emptySale.percentage);
  const [startsAt, setStartsAt] = useState(emptySale.startsAt);
  const [endsAt, setEndsAt] = useState(emptySale.endsAt);
  const [enabled, setEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value_json")
        .eq("key", "sitewide_sale")
        .maybeSingle();

      if (error || !data) return;
      const sale = parseSitewideSale(data.value_json);
      if (!sale) return;
      setName(sale.name ?? "");
      setPercentage(sale.percentage != null ? String(sale.percentage) : "20");
      setStartsAt(utcIsoToKarachiInput(sale.starts_at));
      setEndsAt(utcIsoToKarachiInput(sale.ends_at));
      setEnabled(sale.enabled);
    };

    void load();
  }, []);

  const buildValue = (nextEnabled: boolean): SitewideSale | null => {
    const parsedPercent = Number(percentage);
    if (!Number.isInteger(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
      toast({
        title: "Invalid sale percent",
        description: "Choose a whole percent from 1 to 100.",
        variant: "destructive",
      });
      return null;
    }

    const startIso = karachiInputToUtcIso(startsAt);
    const endIso = karachiInputToUtcIso(endsAt);
    if (startsAt.trim() && !startIso) {
      toast({
        title: "Invalid sale start",
        description: "Choose a valid start date and time.",
        variant: "destructive",
      });
      return null;
    }
    if (endsAt.trim() && !endIso) {
      toast({
        title: "Invalid sale end",
        description: "Choose a valid end date and time.",
        variant: "destructive",
      });
      return null;
    }
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      toast({
        title: "Invalid sale dates",
        description: "Sale end must be later than sale start.",
        variant: "destructive",
      });
      return null;
    }

    return {
      enabled: nextEnabled,
      percentage: parsedPercent,
      name: name.trim() || null,
      starts_at: startIso,
      ends_at: endIso,
    };
  };

  const saveSale = async (nextEnabled: boolean) => {
    const value = buildValue(nextEnabled);
    if (!value) return;

    setIsSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "sitewide_sale", value_json: value },
      { onConflict: "key" },
    );
    setIsSaving(false);

    if (error) {
      toast({
        title: "Could not save sale",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEnabled(nextEnabled);
    toast({
      title: nextEnabled ? "Site sale is on" : "Site sale is off",
      description: nextEnabled
        ? `${value.percentage}% off applies across the store.`
        : "Product prices are back to their own sales and regular prices.",
    });
  };

  const activePercent = getActiveSitewidePercent(
    {
      enabled,
      percentage: Number(percentage),
      name: name.trim() || null,
      starts_at: karachiInputToUtcIso(startsAt),
      ends_at: karachiInputToUtcIso(endsAt),
    },
    new Date(),
  );

  return (
    <div className="bg-card rounded-lg shadow-lg p-8 mb-8">
      <div className="flex items-center gap-3 mb-2">
        <Tag className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Site-wide sale</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {activePercent > 0
          ? `${name.trim() || "Sale"} is live at ${activePercent}% off every product.`
          : "Turn on one percent from 1 to 100. It applies to every product until you turn it off."}
        {" "}Dates use Pakistan time (Asia/Karachi).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sitewide-sale-name">Sale name</Label>
          <Input
            id="sitewide-sale-name"
            placeholder="e.g. 11.11 Sale"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitewide-sale-percent">Percent off</Label>
          <Select value={percentage} onValueChange={setPercentage}>
            <SelectTrigger id="sitewide-sale-percent">
              <SelectValue placeholder="Choose 1 to 100" />
            </SelectTrigger>
            <SelectContent>
              {PERCENT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitewide-sale-start">Starts (Pakistan time)</Label>
          <Input
            id="sitewide-sale-start"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitewide-sale-end">Ends (Pakistan time)</Label>
          <Input
            id="sitewide-sale-end"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <Button type="button" onClick={() => void saveSale(true)} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save sale"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void saveSale(false)}
          disabled={isSaving || !enabled}
        >
          Turn sale off
        </Button>
      </div>
    </div>
  );
}
