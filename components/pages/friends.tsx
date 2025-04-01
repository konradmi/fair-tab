"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function FriendsPage() {
  const { friends, addFriend } = useApp();
  const [newFriend, setNewFriend] = useState({ name: "", email: "", avatar: "/avatar-placeholder.svg" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddFriend = () => {
    if (newFriend.name && newFriend.email) {
      addFriend(newFriend);
      setNewFriend({ name: "", email: "", avatar: "/avatar-placeholder.svg" });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Friends</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new friend</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={newFriend.name}
                  onChange={(e) => setNewFriend({...newFriend, name: e.target.value})}
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newFriend.email}
                  onChange={(e) => setNewFriend({...newFriend, email: e.target.value})}
                  placeholder="john@example.com" 
                />
              </div>
              <Button onClick={handleAddFriend} className="w-full">Add Friend</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.email} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar || "/avatar-placeholder.svg"} alt={friend.name} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No friends added yet. Add friends to start splitting expenses.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
