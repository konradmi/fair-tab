"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActivityPage() {
  const { expenses, friends, groups } = useApp();
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Recent Activity</h1>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {sortedExpenses.length > 0 ? (
              sortedExpenses.map(expense => {
                const paidBy = friends.find(f => f.email === expense.paidByEmail);
                const group = groups.find(g => g.id === expense.groupId);
                
                return (
                  <div key={expense.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <Avatar>
                      <AvatarImage src={paidBy?.avatar || "/avatar-placeholder.svg"} alt={paidBy?.name || "User"} />
                      <AvatarFallback>{paidBy?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{expense.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {paidBy?.name || "Someone"} paid ${expense.amount.toFixed(2)} in {group?.name || "Unknown group"}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()} at {new Date(expense.date).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Split among: </span>
                        {expense.splitAmong.map(email => {
                          const person = friends.find(f => f.email === email);
                          return person?.name || email;
                        }).join(", ")}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity yet. Add expenses to see them here.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
