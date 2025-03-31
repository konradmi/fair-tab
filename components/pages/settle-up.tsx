"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function SettleUpPage() {
  const { friends, getBalances } = useApp();
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = friends[0]?.id; // Assuming first friend is current user
  
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
  
  // Get friends who you owe money to or who owe you money
  const settleUpFriends = friends.filter(friend => 
    friend.id !== currentUserId && 
    balances[currentUserId]?.[friend.id] !== 0 &&
    balances[currentUserId]?.[friend.id] !== undefined
  );

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
                const balance = balances[currentUserId]?.[friend.id] || 0;
                const isPositive = balance > 0;
                
                return (
                  <div key={friend.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar || "/avatar-placeholder.svg"} alt={friend.name} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {isPositive 
                            ? `You owe ${friend.name}` 
                            : `${friend.name} owes you`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isPositive ? "destructive" : "default"}>
                        {isPositive ? "-" : "+"}${Math.abs(balance).toFixed(2)}
                      </Badge>
                      <Button size="sm">Settle</Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No balances to settle up. You&apos;re all squared away!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
