"use client";

import { useParams } from "react-router-dom";
import { useApp } from "@/contexts/app-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { groups, friends, expenses } = useApp();
  
  const group = groups.find(g => g.id === id);
  const groupExpenses = expenses.filter(e => e.groupId === id);
  
  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Group not found</h1>
        <p className="mt-4">The group you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/groups">
          <Button className="mt-4">Back to Groups</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Link to="/expenses/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {group.description && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
              {groupExpenses.length > 0 ? (
                <div className="space-y-4">
                  {groupExpenses.map(expense => {
                    const paidBy = friends.find(f => f.id === expense.paidById);
                    return (
                      <div key={expense.id} className="p-4 rounded-lg border">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{expense.description}</h3>
                            <p className="text-sm text-muted-foreground">
                              Paid by {paidBy?.name || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="font-semibold">${expense.amount.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses found for this group yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Members</h2>
              <div className="space-y-4">
                {group.members.map(memberId => {
                  const member = friends.find(f => f.id === memberId);
                  return (
                    <div key={memberId} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member?.avatar || "/avatar-placeholder.svg"} alt={member?.name || "Member"} />
                        <AvatarFallback>{member?.name?.charAt(0) || "M"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member?.email || ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
