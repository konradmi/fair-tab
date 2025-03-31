"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type Friend,
  type Group,
  type Expense,
  generateId,
} from "@/lib/types"

import * as db from "@/lib/indexed-db"

type AppContextType = {
  friends: Friend[]
  groups: Group[]
  expenses: Expense[]
  addFriend: (friend: Omit<Friend, "id">) => Promise<Friend>
  updateFriend: (friend: Friend) => Promise<Friend>
  removeFriend: (friendId: string) => Promise<void>
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

// Default current user - in a real app, this would come from an authentication system
const defaultUser: Friend = {
  id: "current-user",
  name: "You",
  email: "user@example.com",
  avatar: "/avatar-placeholder.svg",
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser] = useState<Friend>(defaultUser)

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (typeof window === "undefined") return

        // Load data from IndexedDB
        const dbFriends = await db.getAllFriends()
        const dbGroups = await db.getAllGroups()
        const dbExpenses = await db.getAllExpenses()

        // Set state with data from database
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

  // Friend methods
  const addFriend = async (friend: Omit<Friend, "id">) => {
    const newFriend = { ...friend, id: generateId() } as Friend
    const savedFriend = await db.saveFriend(newFriend)
    setFriends(await db.getAllFriends())
    return savedFriend
  }

  const updateFriend = async (friend: Friend) => {
    const updatedFriend = await db.saveFriend(friend)
    setFriends(await db.getAllFriends())
    return updatedFriend
  }

  const removeFriend = async (friendId: string) => {
    await db.deleteFriend(friendId)
    setFriends(await db.getAllFriends())
  }

  // Group methods
  const addGroup = async (group: Omit<Group, "id">) => {
    const newGroup = { ...group, id: generateId() } as Group
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

  // Expense methods
  const addExpense = async (expense: Omit<Expense, "id" | "date">) => {
    const newExpense = {
      ...expense,
      id: generateId(),
      date: new Date().toISOString(),
    }
    const savedExpense = await db.saveExpense(newExpense)
    setExpenses(await db.getAllExpenses())
    return savedExpense
  }

  const updateExpense = async (expense: Expense) => {
    const updatedExpense = await db.saveExpense(expense)
    setExpenses(await db.getAllExpenses())
    return updatedExpense
  }

  const removeExpense = async (expenseId: string) => {
    await db.deleteExpense(expenseId)
    setExpenses(await db.getAllExpenses())
  }

  // Balance calculations
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
        isLoading,
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

