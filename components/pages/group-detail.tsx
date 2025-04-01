"use client";

import { useParams } from "react-router-dom";
import { useApp } from "@/contexts/app-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { FriendSelector } from "@/components/friend-selector";
import { toast } from "sonner";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { groups, friends, expenses, updateGroup } = useApp();
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      setShowAddMembers(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const newMembers = selectedMembers.filter(
        email => !group.members.includes(email)
      );
      
      if (newMembers.length === 0) {
        toast.info("Selected members are already in this group");
        setShowAddMembers(false);
        setIsSubmitting(false);
        return;
      }

      const updatedGroup = {
        ...group,
        members: [...group.members, ...newMembers]
      };

      await updateGroup(updatedGroup);
      toast.success("Members added successfully");
      setShowAddMembers(false);
      setSelectedMembers([]);
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("Failed to add members. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Link to={`/expenses/new?groupId=${id}`}>
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
                    const paidBy = friends.find(f => f.email === expense.paidByEmail);
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
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Members</h2>
                <Button variant="outline" size="sm" onClick={() => setShowAddMembers(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {showAddMembers && (
                <div className="mb-4 p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Add Members</h3>
                  <FriendSelector 
                    selectedFriends={selectedMembers}
                    onSelectionChange={setSelectedMembers}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowAddMembers(false);
                        setSelectedMembers([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleAddMembers}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adding..." : "Add Members"}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {group.members.map(memberEmail => {
                  const member = friends.find(f => f.email === memberEmail);
                  return (
                    <div key={memberEmail} className="flex items-center gap-3">
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
