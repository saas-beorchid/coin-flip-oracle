import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CoinCustomization() {
  const { toast } = useToast();
  
  // Get coin settings from the server
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });
  
  const [headsText, setHeadsText] = useState("HEADS");
  const [tailsText, setTailsText] = useState("TAILS");
  const [coinStyle, setCoinStyle] = useState("default");
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setHeadsText(settings.headsLabel || "HEADS");
      setTailsText(settings.tailsLabel || "TAILS");
      setCoinStyle(settings.coinStyle || "default");
    }
  }, [settings]);
  
  // Apply customization changes
  const handleApplyChanges = async () => {
    try {
      await apiRequest("POST", "/api/settings", {
        headsLabel: headsText,
        tailsLabel: tailsText,
        coinStyle: coinStyle
      });
      
      // Invalidate queries to refresh settings
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      toast({
        title: "Success",
        description: "Coin customization applied!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply customization. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="bg-secondary-bg mb-6 p-4 border-0 animate-pulse">
        <div className="h-4 bg-secondary-bg w-1/3 mb-3"></div>
        <div className="h-10 bg-secondary-bg w-full mb-4"></div>
        <div className="h-10 bg-secondary-bg w-full"></div>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-bg mb-6 p-4 border-0">
      <h3 className="font-semibold text-white mb-3">Customize Your Coin</h3>
      
      {/* Coin Style Selection */}
      <div className="mb-4">
        <Label className="block text-sm font-medium text-accent-text mb-1">Coin Style</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline" 
            data-style="default"
            className={`coin-style-btn text-center p-2 bg-black rounded transition-colors ${coinStyle === 'default' ? 'border-copper' : 'border-accent-text'}`}
            style={{ 
              background: coinStyle === 'default' ? 'linear-gradient(45deg, #D87A3F, #B5551C)' : 'black',
              color: 'white'
            }}
            onClick={() => setCoinStyle("default")}
          >
            Default
          </Button>
          <Button
            variant="outline"
            data-style="gold"
            className={`coin-style-btn text-center p-2 bg-black rounded transition-colors ${coinStyle === 'gold' ? 'border-copper' : 'border-accent-text'}`}
            style={{ 
              background: coinStyle === 'gold' ? 'linear-gradient(45deg, #FFD700, #FFC107)' : 'black',
              color: 'white'
            }}
            onClick={() => setCoinStyle("gold")}
          >
            Gold
          </Button>
          <Button
            variant="outline"
            data-style="silver"
            className={`coin-style-btn text-center p-2 bg-black rounded transition-colors ${coinStyle === 'silver' ? 'border-copper' : 'border-accent-text'}`}
            style={{ 
              background: coinStyle === 'silver' ? 'linear-gradient(45deg, #C0C0C0, #E0E0E0)' : 'black',
              color: coinStyle === 'silver' ? '#333' : 'white'
            }}
            onClick={() => setCoinStyle("silver")}
          >
            Silver
          </Button>
        </div>
      </div>
      
      {/* Label Customization */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium text-accent-text mb-1">Heads Text</Label>
          <Input
            type="text"
            id="heads-text"
            className="w-full p-2 bg-black border border-accent-text rounded text-white"
            value={headsText}
            onChange={(e) => setHeadsText(e.target.value)}
            maxLength={10}
          />
        </div>
        <div>
          <Label className="block text-sm font-medium text-accent-text mb-1">Tails Text</Label>
          <Input
            type="text"
            id="tails-text"
            className="w-full p-2 bg-black border border-accent-text rounded text-white"
            value={tailsText}
            onChange={(e) => setTailsText(e.target.value)}
            maxLength={10}
          />
        </div>
      </div>
      
      {/* Apply Button */}
      <Button
        id="apply-customization"
        className="mt-4 w-full bg-copper text-white py-2 rounded font-medium hover:bg-opacity-90 transition-colors focus:ring-2 focus:ring-copper focus:ring-opacity-50"
        onClick={handleApplyChanges}
      >
        Apply Changes
      </Button>
    </Card>
  );
}
