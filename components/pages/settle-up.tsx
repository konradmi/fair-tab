"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAppAuth } from "@/hooks/useAppAuth";

export default function SettleUpPage() {
  const { friends, getBalances } = useApp();
  const { userEmail } = useAppAuth();
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setIsLoading(true);
        const balanceData = await getBalances();
        setBalances(balanceData);
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBalances();
  }, [getBalances]);
  
  // Get all friends except the current user
  const settleUpFriends = userEmail 
    ? friends.filter(friend => friend.email !== userEmail)
    : [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Settle Up</h1>
        <Card>
          <CardHeader>
            <CardTitle>Who do you want to settle up with?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <div className="animate-pulse text-muted-foreground">Loading balances...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settle Up</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Who do you want to settle up with?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settleUpFriends.length > 0 ? (
              settleUpFriends.map(friend => {
                // Get balance between current user and this friend
                // We need to invert the balance to match the expected display
                // In the raw data, positive means user owes the friend, negative means friend owes the user
                // We're going to invert this for display so positive shows what friends owe the user
                const rawBalance = userEmail ? (balances[userEmail]?.[friend.email] || 0) : 0;
                const displayBalance = -rawBalance; // Invert the balance for display
                
                // If balance is 0, show "settled up"
                if (displayBalance === 0) {
                  return (
                    <div key={friend.email} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.avatar || "/avatar-placeholder.svg"} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.name}</p>
                          <p className="text-sm text-muted-foreground">All settled up</p>
                        </div>
                      </div>
                      <Badge variant="outline">Settled</Badge>
                    </div>
                  );
                }
                
                // For displaying, positive means friend owes user
                // negative means user owes friend
                const friendOwesUser = displayBalance > 0;
                
                return (
                  <div key={friend.email} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar || "/avatar-placeholder.svg"} alt={friend.name} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {friendOwesUser
                            ? `${friend.name} owes you`
                            : `You owe ${friend.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={friendOwesUser ? "default" : "destructive"}>
                        {friendOwesUser ? "+" : "-"}${Math.abs(displayBalance).toFixed(2)}
                      </Badge>
                      <Button size="sm">Settle</Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No friends found. Add some friends to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
