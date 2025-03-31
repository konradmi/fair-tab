"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/app-context";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FriendSelector } from "@/components/friend-selector";
import { toast } from "sonner";

export default function NewGroupPage() {
  const { addGroup } = useApp();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGroup = async () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      setIsSubmitting(true);
      try {
        const newGroup = await addGroup({
          name: groupName.trim(),
          description: description.trim(),
          members: selectedMembers,
          expenses: [],
        });
        toast.success("Group created successfully");
        navigate(`/groups/${newGroup.id}`);
      } catch (error) {
        console.error("Error creating group:", error);
        toast.error("Failed to create group. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create a New Group</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input 
              id="name" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Roommates, Trip to Paris, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group for?"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Add Group Members</Label>
            <FriendSelector 
              selectedFriends={selectedMembers} 
              onSelectionChange={setSelectedMembers} 
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
