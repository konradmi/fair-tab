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
  addGroup: (group: Omit<Group, "id">) => Promise<Group>
  updateGroup: (group: Group) => Promise<Group>
  removeGroup: (groupId: string) => Promise<void>
  addExpense: (expense: Omit<Expense, "id" | "date">) => Promise<Expense>
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
  })
  
  useEffect(() => {
    const updateCurrentUser = async () => {
      if (!isAuthLoading && userEmail) {
        const existingUser = await db.getFriendByEmail(userEmail)
        
        const updatedUser: Friend = existingUser || {
          name: user?.firstName || (userEmail ? userEmail.split('@')[0] : "You"),
          email: userEmail,
          avatar: user?.imageUrl || "/avatar-placeholder.svg",
        }
        
        setCurrentUser(updatedUser)
        
        if (!existingUser) {
          await db.saveFriend(updatedUser)
          setFriends(await db.getAllFriends())
        }
      }
    }
    
    updateCurrentUser()
  }, [user, userEmail, isAuthLoading])

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (typeof window === "undefined") return
        
        await db.getDb()

        const dbFriends = await db.getAllFriends()
        const dbGroups = await db.getAllGroups()
        const dbExpenses = await db.getAllExpenses()

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
  }, [])

  const addFriend = async (friend: Friend) => {
    try {
      const existingFriend = await db.getFriendByEmail(friend.email)
      if (existingFriend) {
        return existingFriend
      }
      
      const savedFriend = await db.saveFriend(friend)
      setFriends(await db.getAllFriends())
      return savedFriend
    } catch (error) {
      console.error("Error adding friend:", error)
      throw error
    }
  }

  const updateFriend = async (friend: Friend) => {
    const updatedFriend = await db.saveFriend(friend)
    setFriends(await db.getAllFriends())
    return updatedFriend
  }

  const removeFriend = async (friendEmail: string) => {
    await db.deleteFriend(friendEmail)
    setFriends(await db.getAllFriends())
  }

  const addGroup = async (group: Omit<Group, "id">) => {
    const members = [...group.members]
    if (currentUser.email && !members.includes(currentUser.email)) {
      members.push(currentUser.email)
    }
    
    const newGroup = { 
      ...group, 
      id: generateId(),
      members
    } as Group
    
    const savedGroup = await db.saveGroup(newGroup)
    setGroups(await db.getAllGroups())
    return savedGroup
  }

  const updateGroup = async (group: Group) => {
    const updatedGroup = await db.saveGroup(group)
    setGroups(await db.getAllGroups())
    return updatedGroup
  }

  const removeGroup = async (groupId: string) => {
    await db.deleteGroup(groupId)
    setGroups(await db.getAllGroups())
  }

  const addExpense = async (expense: Omit<Expense, "id" | "date">) => {
    const paidByEmail = expense.paidByEmail || currentUser.email;
    
    const splitAmong = expense.splitAmong.map(identifier => {
      if (identifier.includes('@')) {
        return identifier;
      }
      return currentUser.email;
    });
    
    const uniqueSplitAmong = [...new Set(splitAmong)];
    if (uniqueSplitAmong.length === 0) {
      uniqueSplitAmong.push(currentUser.email);
    }
    
    const newExpense = {
      ...expense,
      id: generateId(),
      date: new Date().toISOString(),
      paidByEmail,
      paidById: "",
      splitAmong: uniqueSplitAmong,
    };
    
    const savedExpense = await db.saveExpense(newExpense);
    setExpenses(await db.getAllExpenses());
    return savedExpense;
  }

  const updateExpense = async (expense: Expense) => {
    const updatedExpense = {
      ...expense,
      paidByEmail: expense.paidByEmail || currentUser.email
    };
    
    const savedExpense = await db.saveExpense(updatedExpense)
    setExpenses(await db.getAllExpenses())
    return savedExpense
  }

  const removeExpense = async (expenseId: string) => {
    await db.deleteExpense(expenseId)
    setExpenses(await db.getAllExpenses())
  }

  const getBalances = async () => {
    return db.calculateBalances()
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

