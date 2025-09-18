import { useState, useRef, useEffect } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useCoinFlip(coinSettings: any) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [headsLabel, setHeadsLabel] = useState("HEADS");
  const [tailsLabel, setTailsLabel] = useState("TAILS");
  const [coinStyle, setCoinStyle] = useState("default");
  
  const coinRef = useRef<HTMLDivElement>(null);
  
  // Update labels and style when settings change
  useEffect(() => {
    if (coinSettings) {
      setHeadsLabel(coinSettings.headsLabel || "HEADS");
      setTailsLabel(coinSettings.tailsLabel || "TAILS");
      setCoinStyle(coinSettings.coinStyle || "default");
    }
  }, [coinSettings]);
  
  const flipCoin = async (): Promise<string> => {
    if (isFlipping) return outcome || "heads";
    
    setIsFlipping(true);
    setResultText("");
    
    // Add animation class if it exists
    if (coinRef.current) {
      coinRef.current.classList.add("animate-flip");
    }
    
    // Allow animation to start before determining outcome
    // Return a promise that resolves with the outcome
    return new Promise((resolve) => {
      setTimeout(() => {
        // Determine outcome randomly
        const result = Math.random() < 0.5 ? "heads" : "tails";
        setOutcome(result);
        
        // Update result text
        const text = result === "heads" ? headsLabel : tailsLabel;
        setResultText(`Result: ${text}!`);
        
        // Reset animation after completion
        setTimeout(() => {
          if (coinRef.current) {
            coinRef.current.classList.remove("animate-flip");
          }
          setIsFlipping(false);
          resolve(result);
        }, 100);
      }, 1000);
    });
  };
  
  return {
    isFlipping,
    outcome,
    resultText,
    flipCoin,
    coinRef,
    headsLabel,
    tailsLabel,
    coinStyle
  };
}
