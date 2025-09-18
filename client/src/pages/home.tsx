import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import CoinCustomization from "@/components/coin-flip/CoinCustomization";
import FlipHistory from "@/components/coin-flip/FlipHistory";
import AIInsightModal from "@/components/coin-flip/AIInsightModal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCoinFlip } from "@/hooks/use-coin-flip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import Coin3D from "@/components/coin-flip/Coin3D";
import { loadStripe } from "@stripe/stripe-js";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";

// Initialize Stripe with environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function Home() {
  const { toast } = useToast();
  const { user } = useUser();
  const [decisionContext, setDecisionContext] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check for payment success in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");

    const contextFromUrl = urlParams.get("context"); // Get preserved context from URL

    if (paymentStatus === "success" && sessionId && user?.id) {
      // Verify payment with Stripe and perform the coin flip
      apiRequest("POST", "/api/payment-success", { sessionId, userId: user.id })
        .then(async () => {
          toast({
            title: "Payment Successful!",
            description: "Flipping your coin now...",
          });
          
          // Perform the coin flip since payment was successful
          const result = await flipCoin();
          
          // Save flip (with optional AI suggestion)
          try {
            const res = await apiRequest("POST", "/api/flip", {
              outcome: result,
              context: contextFromUrl || decisionContext.trim() || undefined,
              headsLabel: (coinSettings as any)?.headsLabel || "HEADS",
              tailsLabel: (coinSettings as any)?.tailsLabel || "TAILS", 
              coinStyle: (coinSettings as any)?.coinStyle || "copper",
              userId: user.id,
            });

            const flipData = await res.json();

            if (flipData.aiSuggestion) {
              setIsModalOpen(true);
            }

            queryClient.invalidateQueries({ queryKey: ["/api/history"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          } catch (error) {
            toast({
              title: "Flip Error",
              description: "Payment successful but failed to save flip results.",
              variant: "destructive",
            });
          }
          
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        })
        .catch((error) => {
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support if payment was processed.",
            variant: "destructive",
          });
          // Clean up URL even if verification failed
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        });
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description:
          "Payment was cancelled. Try again to access the coin flip feature.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user?.id, toast]);

  // ✅ Get coin settings
  const { data: coinSettings } = useQuery({
    queryKey: ["/api/settings"],
    refetchOnWindowFocus: false,
  });

  // Check payment status
  const { data: paymentStatus, isLoading: isPaymentStatusLoading } = useQuery({
    queryKey: ["/api/check-payment", user?.id],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/check-payment?userId=${user?.id || "default"}`,
      );
      return res.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Check every 5 seconds for payment updates
  });

  // ✅ Coin flip hook
  const {
    isFlipping,
    outcome,
    resultText,
    flipCoin,
    coinRef,
    headsLabel,
    tailsLabel,
    coinStyle,
  } = useCoinFlip(coinSettings);

  // Mutation: Create Stripe Checkout session
  const createCheckoutSession = useMutation({
    mutationFn: async () => {
      const contextParam = decisionContext.trim() ? `&context=${encodeURIComponent(decisionContext.trim())}` : '';
      const res = await apiRequest("POST", "/api/create-checkout-session", {
        amount: 100, // $1.00 in cents
        currency: "usd",
        success_url: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}&payment=success${contextParam}`,
        cancel_url: `${window.location.origin}?payment=cancelled`,
        userId: user?.id || "default",
      });
      return res.json();
    },
    onSuccess: async (data) => {
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }
      // Don't call handleFlip here since payment redirects to Stripe
      // Payment processing will happen on return from Stripe checkout

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (error)
         {
        toast({
          title: "Payment Error",
          description:
            error.message || "Failed to redirect to payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle coin flip button
  const handleFlip = async () => {
    if (isFlipping || isPaymentStatusLoading) return;

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the coin flip feature.",
        variant: "destructive",
      });
      return;
    }

    // Require payment for each flip
    createCheckoutSession.mutate();
    return;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
      {/* Header */}
      <header className="w-full max-w-4xl text-center mb-8">
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="bg-copper text-white font-semibold">
              Sign In to Continue
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <h1 className="text-3xl md:text-4xl font-bold mb-1">
          <span className="text-gold">Coin</span> Oracle
        </h1>
        <p className="text-accent-text text-sm md:text-base leading-relaxed">
          Make decisions with a virtual coin flip powered by AI
        </p>
      </header>

      {/* Main content only visible to signed-in users */}
      <SignedIn>
        <div className="w-full flex flex-col md:flex-row gap-6 items-start">
          {/* Coin Section */}
          <div className="w-full md:w-7/12 flex flex-col items-center justify-center">
            <Coin3D
              ref={coinRef}
              isFlipping={isFlipping}
              outcome={outcome}
              resultText={resultText}
              headsLabel={headsLabel}
              tailsLabel={tailsLabel}
              coinStyle={coinStyle}
            />

            {/* Flip Button */}
            <Button
              onClick={handleFlip}
              className="ripple flip-btn bg-copper hover:bg-opacity-90 text-white font-bold py-8 px-10 rounded-full text-xl transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-copper focus:ring-opacity-50 animate-shine"
              disabled={
                isFlipping ||
                createCheckoutSession.isPending ||
                isPaymentStatusLoading
              }
              size="lg"
            >
              {createCheckoutSession.isPending
                ? "Loading..."
                : paymentStatus?.hasPaid
                  ? "FLIP COIN"
                  : "PAY TO FLIP"}
            </Button>

            {/* Decision Context */}
            <div className="mt-8 w-full max-w-md">
              <Card className="bg-secondary-bg p-4 border-0">
                <h3 className="font-semibold text-white mb-2">
                  Decision Context (Optional)
                </h3>
                <Textarea
                  value={decisionContext}
                  onChange={(e) => setDecisionContext(e.target.value)}
                  className="w-full p-3 bg-black border border-copper rounded text-white"
                  placeholder="What decision are you making? (e.g., 'Should I go out tonight?')"
                  rows={2}
                />
              </Card>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-full md:w-5/12">
            <CoinCustomization />
            <FlipHistory />
          </div>
        </div>

        {/* AI Insight Modal */}
        <AIInsightModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          outcome={outcome}
          headsLabel={headsLabel}
          tailsLabel={tailsLabel}
          decisionContext={decisionContext}
        />
      </SignedIn>

      {/* Footer */}
      <footer className="w-full max-w-4xl mt-12 text-center text-accent-text text-sm">
        <p>© {new Date().getFullYear()} Coin Oracle</p>
      </footer>
    </div>
  );
}
