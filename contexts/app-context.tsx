"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type Friend,
  type Group,
  type Expense,
  generateId,
} from "@/lib/types"
import { useAppAuth } from "@/hooks/useAppAuth"

import * as db from "@/lib/indexed-db"

type AppContextType = {
  friends: Friend[]
  groups: Group[]
  expenses: Expense[]
  addFriend: (friend: Friend) => Promise<Friend>
  updateFriend: (friend: Friend) => Promise<Friend>
  removeFriend: (friendEmail: string) => Promise<void>
  addGroup: (group: Omit<Group, "id" | "ownerEmail">) => Promise<Group>
  updateGroup: (group: Group) => Promise<Group>
  removeGroup: (groupId: string) => Promise<void>
  addExpense: (expense: Omit<Expense, "id" | "date" | "ownerEmail">) => Promise<Expense>
  updateExpense: (expense: Expense) => Promise<Expense>
  removeExpense: (expenseId: string) => Promise<void>
  getBalances: () => Promise<Record<string, Record<string, number>>>
  isLoading: boolean
  currentUser: Friend
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, userEmail, isLoading: isAuthLoading } = useAppAuth()
  
  const [currentUser, setCurrentUser] = useState<Friend>({
    name: "You",
    email: "user@example.com",
    avatar: "/avatar-placeholder.svg",
    ownerEmail: "user@example.com",
    accessibleTo: ["user@example.com"]
  })
  
  useEffect(() => {
    const updateCurrentUser = async () => {
      if (!isAuthLoading && userEmail) {
        const existingUser = await db.getFriendByEmail(userEmail, userEmail)
        
        const updatedUser: Friend = existingUser || {
          name: user?.firstName || (userEmail ? userEmail.split('@')[0] : "You"),
          email: userEmail,
          avatar: user?.imageUrl || "/avatar-placeholder.svg",
          ownerEmail: userEmail,
          accessibleTo: [userEmail]
        }
        
        setCurrentUser(updatedUser)
        
        if (!existingUser) {
          await db.saveFriend(updatedUser, userEmail)
          setFriends(await db.getAllFriends(userEmail))
        }
      }
    }
    
    updateCurrentUser()
  }, [user, userEmail, isAuthLoading])

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (typeof window === "undefined" || !userEmail) return
        
        await db.getDb()

        const dbFriends = await db.getAllFriends(userEmail)
        const dbGroups = await db.getAllGroups(userEmail)
        const dbExpenses = await db.getAllExpenses(userEmail)

        setFriends(dbFriends)
        setGroups(dbGroups)
        setExpenses(dbExpenses)
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing data:", error)
        setIsLoading(false)
      }
    }

    initializeData()
  }, [userEmail])

  const addFriend = async (friend: Friend) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    try {
      friend.ownerEmail = userEmail
      friend.accessibleTo = [userEmail]
      
      const existingFriend = await db.getFriendByEmail(friend.email, userEmail)
      if (existingFriend) {
        return existingFriend
      }
      
      const savedFriend = await db.saveFriend(friend, userEmail)
      setFriends(await db.getAllFriends(userEmail))
      return savedFriend
    } catch (error) {
      console.error("Error adding friend:", error)
      throw error
    }
  }

  const updateFriend = async (friend: Friend) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    const updatedFriend = await db.saveFriend(friend, userEmail)
    setFriends(await db.getAllFriends(userEmail))
    return updatedFriend
  }

  const removeFriend = async (friendEmail: string) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    await db.deleteFriend(friendEmail, userEmail)
    setFriends(await db.getAllFriends(userEmail))
  }

  const addGroup = async (group: Omit<Group, "id" | "ownerEmail">) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    const members = [...group.members]
    if (userEmail && !members.includes(userEmail)) {
      members.push(userEmail)
    }
    
    const newGroup = { 
      ...group, 
      id: generateId(),
      members,
      ownerEmail: userEmail
    } as Group
    
    const savedGroup = await db.saveGroup(newGroup, userEmail)
    setGroups(await db.getAllGroups(userEmail))
    
    for (const memberEmail of members) {
      if (memberEmail === userEmail) continue
      
      let friend = await db.getFriendByEmail(memberEmail, userEmail)
      
      if (!friend) {
        friend = {
          name: memberEmail.split('@')[0],
          email: memberEmail,
          avatar: "/avatar-placeholder.svg",
          ownerEmail: userEmail,
          accessibleTo: [userEmail]
        }
        await db.saveFriend(friend, userEmail)
      } else if (!friend.accessibleTo.includes(userEmail)) {
        friend.accessibleTo.push(userEmail)
        await db.saveFriend(friend, userEmail)
      }
    }
    
    setFriends(await db.getAllFriends(userEmail))
    return savedGroup
  }

  const updateGroup = async (group: Group) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    const updatedGroup = await db.saveGroup(group, userEmail)
    setGroups(await db.getAllGroups(userEmail))
    
    for (const memberEmail of group.members) {
      if (memberEmail === userEmail) continue
      
      let friend = await db.getFriendByEmail(memberEmail, userEmail)
      
      if (!friend) {
        friend = {
          name: memberEmail.split('@')[0],
          email: memberEmail,
          avatar: "/avatar-placeholder.svg",
          ownerEmail: userEmail,
          accessibleTo: [userEmail]
        }
        await db.saveFriend(friend, userEmail)
      } else if (!friend.accessibleTo.includes(userEmail)) {
        friend.accessibleTo.push(userEmail)
        await db.saveFriend(friend, userEmail)
      }
    }
    
    setFriends(await db.getAllFriends(userEmail))
    return updatedGroup
  }

  const removeGroup = async (groupId: string) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    await db.deleteGroup(groupId, userEmail)
    setGroups(await db.getAllGroups(userEmail))
  }

  const addExpense = async (expense: Omit<Expense, "id" | "date" | "ownerEmail">) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    const paidByEmail = expense.paidByEmail || userEmail;
    
    const splitAmong = expense.splitAmong.map(identifier => {
      if (identifier.includes('@')) {
        return identifier;
      }
      return userEmail;
    });
    
    const uniqueSplitAmong = [...new Set(splitAmong)];
    if (uniqueSplitAmong.length === 0) {
      uniqueSplitAmong.push(userEmail);
    }
    
    const newExpense = {
      ...expense,
      id: generateId(),
      date: new Date().toISOString(),
      paidByEmail,
      paidById: "",
      splitAmong: uniqueSplitAmong,
      ownerEmail: userEmail
    };
    
    const savedExpense = await db.saveExpense(newExpense, userEmail);
    setExpenses(await db.getAllExpenses(userEmail));
    return savedExpense;
  }

  const updateExpense = async (expense: Expense) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    const updatedExpense = {
      ...expense,
      paidByEmail: expense.paidByEmail || userEmail
    };
    
    const savedExpense = await db.saveExpense(updatedExpense, userEmail)
    setExpenses(await db.getAllExpenses(userEmail))
    return savedExpense
  }

  const removeExpense = async (expenseId: string) => {
    if (!userEmail) throw new Error("User not authenticated")
    
    await db.deleteExpense(expenseId, userEmail)
    setExpenses(await db.getAllExpenses(userEmail))
  }

  const getBalances = async () => {
    if (!userEmail) throw new Error("User not authenticated")
    
    return db.calculateBalances(userEmail)
  }

  return (
    <AppContext.Provider
      value={{
        friends,
        groups,
        expenses,
        addFriend,
        updateFriend,
        removeFriend,
        addGroup,
        updateGroup,
        removeGroup,
        addExpense,
        updateExpense,
        removeExpense,
        getBalances,
        isLoading: isLoading || isAuthLoading,
        currentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

