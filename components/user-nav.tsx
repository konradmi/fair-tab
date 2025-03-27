"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "react-router-dom"
import { useAppAuth } from "@/hooks/useAppAuth"

export function UserNav() {
  const { isOnline, user, signOut, isLoading, isAuthenticated } = useAppAuth()

  const handleSignOut = async () => {
    localStorage.removeItem('offlineAuthOk');
    localStorage.removeItem('userEmail');
    
    if (isOnline && isAuthenticated) {
        await signOut?.();
    }
    
    window.location.href = '/sign-in';
  }

  if (isLoading && isOnline) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  let userName = '';
  let userEmail = '';
  let userImage = '';
  
  if (isOnline && user) {
    // Online mode: get data from Clerk
    userName = user.firstName ? 
      (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : 
      (user?.username || 'User');
    userEmail = user.primaryEmailAddress?.emailAddress || '';
    userImage = user.imageUrl;
  } else {
    // Offline mode: get data from localStorage
    userEmail = localStorage.getItem('userEmail') || '';
    userName = userEmail.split('@')[0] || 'User';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userImage || "/avatar-placeholder.svg"} alt={userName} />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link to="/profile" className="w-full">
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/settings" className="w-full">
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

