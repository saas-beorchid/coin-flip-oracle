import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CoinProps {
  isFlipping: boolean;
  outcome: string | null;
  resultText: string;
  headsLabel: string;
  tailsLabel: string;
  coinStyle: string;
}

const Coin = forwardRef<HTMLDivElement, CoinProps>(
  ({ isFlipping, outcome, resultText, headsLabel, tailsLabel, coinStyle }, ref) => {
    // Determine styles based on coin style
    const getHeadsStyles = () => {
      switch (coinStyle) {
        case "gold":
          return {
            background: "linear-gradient(45deg, #FFD700, #FFC107)",
            borderColor: "#FFD700",
          };
        case "silver":
          return {
            background: "linear-gradient(45deg, #C0C0C0, #E0E0E0)",
            borderColor: "#A0A0A0",
          };
        default: // Default copper style
          return {
            background: "linear-gradient(45deg, #D87A3F, #FFD700)",
            borderColor: "#D87A3F",
          };
      }
    };

    const getTailsStyles = () => {
      switch (coinStyle) {
        case "gold":
          return {
            background: "linear-gradient(45deg, #E0E0E0, #FFD700)",
            borderColor: "#FFD700",
          };
        case "silver":
          return {
            background: "linear-gradient(45deg, #808080, #C0C0C0)",
            borderColor: "#A0A0A0",
          };
        default: // Default copper style
          return {
            background: "linear-gradient(45deg, #4B5563, #D87A3F)",
            borderColor: "#D87A3F",
          };
      }
    };

    const headsStyles = getHeadsStyles();
    const tailsStyles = getTailsStyles();

    return (
      <div className="relative mb-8 h-[220px] flex items-center justify-center">
        <div 
          ref={ref}
          className={cn(
            "coin w-[200px] h-[200px] relative", 
            isFlipping && "animate-flip"
          )}
          style={{ 
            transformStyle: "preserve-3d",
            transition: "transform 1s ease-in-out",
            transform: outcome === "tails" ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          <div 
            className="coin-side heads absolute w-full h-full rounded-full flex items-center justify-center font-bold text-2xl text-black"
            style={{
              backfaceVisibility: "hidden",
              background: headsStyles.background,
              borderColor: headsStyles.borderColor,
              border: "4px solid"
            }}
          >
            {headsLabel}
          </div>
          <div 
            className="coin-side tails absolute w-full h-full rounded-full flex items-center justify-center font-bold text-2xl text-white"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: tailsStyles.background,
              borderColor: tailsStyles.borderColor,
              border: "4px solid"
            }}
          >
            {tailsLabel}
          </div>
        </div>
        <div 
          className={cn(
            "absolute -bottom-12 text-xl font-semibold text-center text-white transition-opacity duration-300",
            resultText ? "opacity-100" : "opacity-0"
          )}
        >
          {resultText}
        </div>
      </div>
    );
  }
);

Coin.displayName = "Coin";

export default Coin;
