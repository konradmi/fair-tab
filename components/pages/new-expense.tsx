"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/app-context";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewExpensePage() {
  const { addExpense, groups, friends } = useApp();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [groupId, setGroupId] = useState("");
  const [paidById, setPaidById] = useState("");

  const selectedGroup = groups.find(g => g.id === groupId);

  const handleCreateExpense = () => {
    if (description && amount && groupId && paidById) {
      const parsedAmount = parseFloat(amount);
      
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        addExpense({
          description,
          amount: parsedAmount,
          paidById,
          groupId,
          splitAmong: selectedGroup?.members || [],
        });
        
        navigate(`/groups/${groupId}`);
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
          
          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidById} onValueChange={setPaidById}>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {friends.map(friend => (
                  <SelectItem key={friend.id} value={friend.id}>
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
              disabled={!description || !amount || !groupId || !paidById}
            >
              Save Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
