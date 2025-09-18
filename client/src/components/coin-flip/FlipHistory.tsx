import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FlipHistory() {
  const { toast } = useToast();
  
  // Get flip history from the server
  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["/api/history"],
  });
  
  // Get flip statistics
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Flip history cleared!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Function to format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const flipTime = new Date(timestamp);
    const secondsAgo = Math.floor((now.getTime() - flipTime.getTime()) / 1000);
    
    if (secondsAgo < 60) return 'just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min${Math.floor(secondsAgo / 60) > 1 ? 's' : ''} ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hr${Math.floor(secondsAgo / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(secondsAgo / 86400)} day${Math.floor(secondsAgo / 86400) > 1 ? 's' : ''} ago`;
  };
  
  // Clear history handler
  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };
  
  const isLoading = isHistoryLoading || isStatsLoading;
  
  if (isLoading) {
    return (
      <Card className="bg-secondary-bg p-4 border-0 animate-pulse">
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 bg-secondary-bg w-1/4"></div>
          <div className="h-4 bg-secondary-bg w-1/6"></div>
        </div>
        <div className="h-64 bg-black opacity-50 rounded mb-4"></div>
        <div className="h-6 bg-secondary-bg w-full"></div>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary-bg p-4 border-0">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white">Flip History</h3>
        <Button
          id="clear-history"
          variant="ghost"
          className="text-sm text-copper hover:text-gold transition-colors p-0 h-auto"
          onClick={handleClearHistory}
          disabled={clearHistoryMutation.isPending}
        >
          Clear All
        </Button>
      </div>
      
      <ScrollArea className="max-h-64" type="auto">
        {!history || history.length === 0 ? (
          // Empty state
          <div id="empty-history" className="py-8 text-center text-accent-text">
            <p>No flips yet. Start flipping!</p>
          </div>
        ) : (
          // History items
          history.map((flip: any) => (
            <div key={flip.id} className="history-item py-3 px-1 border-b border-accent-text border-opacity-20 last:border-b-0">
              <div className="flex justify-between">
                <span className="font-medium">
                  {flip.outcome === 'heads' ? flip.headsLabel : flip.tailsLabel}
                </span>
                <span className="text-accent-text text-sm">
                  {getTimeAgo(flip.timestamp)}
                </span>
              </div>
              {flip.context && (
                <p className="text-sm text-accent-text truncate">
                  {flip.context}
                </p>
              )}
            </div>
          ))
        )}
      </ScrollArea>
      
      {/* Stats Section */}
      <div className="mt-4 pt-3 border-t border-accent-text border-opacity-20">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-accent-text">Heads:</span>
            <span id="heads-count" className="ml-1 font-medium">
              {stats ? stats.headsCount : 0}
            </span>
          </div>
          <div>
            <span className="text-accent-text">Tails:</span>
            <span id="tails-count" className="ml-1 font-medium">
              {stats ? stats.tailsCount : 0}
            </span>
          </div>
          <div>
            <span className="text-accent-text">Total:</span>
            <span id="total-count" className="ml-1 font-medium">
              {stats ? stats.totalCount : 0}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
