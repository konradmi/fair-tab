"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import BalanceSummary from "@/components/balance-summary";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/app-context";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { groups, friends, getBalances } = useApp();
  const [groupBalances, setGroupBalances] = useState<Record<string, number>>({});

  // Calculate total balance for each group
  useEffect(() => {
    const calculateBalances = async () => {
      try {
        const balances = await getBalances();
        const groupTotals: Record<string, number> = {};

        groups.forEach((group) => {
          let total = 0;
          // Assuming the first member is the current user for this example
          const currentUserId = group.members[0];

          if (currentUserId) {
            group.members.forEach((memberId) => {
              if (memberId !== currentUserId) {
                // Using optional chaining to safely access nested properties
                total += (balances[currentUserId]?.[memberId] || 0);
              }
            });
          }

          groupTotals[group.id] = total;
        });

        setGroupBalances(groupTotals);
      } catch (error) {
        console.error("Error calculating balances:", error);
        // Set empty balances in case of error
        setGroupBalances({});
      }
    };

    calculateBalances();
  }, [groups, getBalances]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Link to="/groups/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Group
              </Button>
            </Link>
          </div>

          <BalanceSummary />

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
              <div className="space-y-4 p-1">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <Link key={group.id} to={`/groups/${group.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-2">
                            {group.members.slice(0, 3).map((memberId) => {
                              const member = friends.find((f) => f.id === memberId);
                              return (
                                <Avatar key={memberId} className="border-2 border-background h-8 w-8">
                                  <AvatarImage
                                    src={member?.avatar || "/avatar-placeholder.svg"}
                                    alt={member?.name || "Member"}
                                  />
                                  <AvatarFallback>{member?.name?.charAt(0) || "M"}</AvatarFallback>
                                </Avatar>
                              );
                            })}
                            {group.members.length > 3 && (
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs">
                                +{group.members.length - 3}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">{group.members.length} members</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {groupBalances[group.id] !== 0 ? (
                            <Badge variant={groupBalances[group.id] > 0 ? "default" : "destructive"}>
                              {groupBalances[group.id] > 0 ? "+" : "-"}${Math.abs(groupBalances[group.id]).toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Settled up</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No groups found. Create a new group to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3 p-1">
              <Link to="/expenses/new">
                <Button className="w-full justify-start" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add an expense
                </Button>
              </Link>
              <Link to="/settle">
                <Button className="w-full justify-start" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Settle up
                </Button>
              </Link>
              <Link to="/settings">
                <Button className="w-full justify-start" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
