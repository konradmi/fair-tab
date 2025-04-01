"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/app-context";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function NewExpensePage() {
  const { addExpense, groups, friends } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [groupId, setGroupId] = useState("");
  const [paidByEmail, setPaidByEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if groupId is provided in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const groupIdParam = params.get("groupId");
    if (groupIdParam) {
      setGroupId(groupIdParam);
    }
  }, [location.search]);

  const selectedGroup = groups.find(g => g.id === groupId);
  const comingFromGroup = new URLSearchParams(location.search).has("groupId");

  const handleCreateExpense = async () => {
    if (description && amount && groupId && paidByEmail) {
      const parsedAmount = parseFloat(amount);
      
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setIsSubmitting(true);
        try {
          await addExpense({
            description,
            amount: parsedAmount,
            paidByEmail,
            paidById: "",
            groupId,
            splitAmong: selectedGroup?.members || [],
          });
          
          toast.success("Expense added successfully");
          navigate(`/groups/${groupId}`);
        } catch (error) {
          console.error("Error adding expense:", error);
          toast.error("Failed to add expense. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Expense</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner, Movie tickets, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          {!comingFromGroup && (
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidByEmail} onValueChange={setPaidByEmail}>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {friends.map(friend => (
                  <SelectItem key={friend.email} value={friend.email}>
                    {friend.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateExpense}
              disabled={!description || !amount || !groupId || !paidByEmail || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
