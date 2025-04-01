"use client"

import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/contexts/app-context"
import { toast } from "sonner"

interface FriendSelectorProps {
  selectedFriends: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export function FriendSelector({ selectedFriends, onSelectionChange }: FriendSelectorProps) {
  const { friends, addFriend } = useApp()
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newFriendEmail, setNewFriendEmail] = useState("")
  const [newFriendName, setNewFriendName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelect = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      onSelectionChange(selectedFriends.filter((id) => id !== friendId))
    } else {
      onSelectionChange([...selectedFriends, friendId])
    }
  }

  const handleAddFriend = async () => {
    if (newFriendName && newFriendEmail) {
      setIsSubmitting(true)
      try {
        const newFriend = await addFriend({
          name: newFriendName,
          email: newFriendEmail,
          avatar: "/avatar-placeholder.svg",
        })

        if (!selectedFriends.includes(newFriend.email)) {
          onSelectionChange([...selectedFriends, newFriend.email])
        }

        toast.success("Friend added successfully")
        setNewFriendName("")
        setNewFriendEmail("")
        setDialogOpen(false)
      } catch (error) {
        console.error("Error adding friend:", error)
        toast.error("Failed to add friend. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const removeFriend = (friendId: string) => {
    onSelectionChange(selectedFriends.filter((id) => id !== friendId))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedFriends.map((friendEmail) => {
          const friend = friends.find((f) => f.email === friendEmail)
          if (!friend) return null

          return (
            <Badge key={friend.email} variant="secondary" className="flex items-center gap-1">
              <span>{friend.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full"
                onClick={() => removeFriend(friend.email)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Select friends
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={8}>
            <Command>
              <CommandInput placeholder="Search friends..." />
              <CommandList>
                <CommandEmpty>No friends found.</CommandEmpty>
                <CommandGroup>
                  {friends.map((friend) => (
                    <CommandItem
                      key={friend.email}
                      onSelect={() => handleSelect(friend.email)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">{friend.name}</p>
                        <p className="text-xs text-muted-foreground">{friend.email}</p>
                      </div>
                      <div className="flex h-4 w-4 items-center justify-center">
                        {selectedFriends.includes(friend.email) && <Check className="h-4 w-4" />}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add new
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Friend</DialogTitle>
              <DialogDescription>Enter your friend&apos;s details to add them to your contacts.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Friend&apos;s name"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFriend} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Friend"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

