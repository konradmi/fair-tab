"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type Friend,
  type Group,
  type Expense,
  getFriends,
  getGroups,
  getExpenses,
  saveFriend,
  saveGroup,
  saveExpense,
  deleteFriend,
  deleteGroup,
  deleteExpense,
  calculateBalances,
  generateId,
} from "@/lib/local-storage"

// Mock data
const mockFriends: Friend[] = [
  { id: "f1", name: "Jane Smith", email: "jane@example.com", avatar: "/avatar-placeholder.svg" },
  { id: "f2", name: "Bob Johnson", email: "bob@example.com", avatar: "/avatar-placeholder.svg" },
  { id: "f3", name: "Alice Brown", email: "alice@example.com", avatar: "/avatar-placeholder.svg" },
  { id: "f4", name: "Charlie Davis", email: "charlie@example.com", avatar: "/avatar-placeholder.svg" },
  { id: "f5", name: "Eva Wilson", email: "eva@example.com", avatar: "/avatar-placeholder.svg" },
]

const mockGroups: Group[] = [
  {
    id: "g1",
    name: "Roommates",
    description: "Expenses for our apartment",
    members: ["f1", "f2", "f3"],
    expenses: ["e1", "e2"],
  },
  {
    id: "g2",
    name: "Trip to Paris",
    description: "Our vacation expenses",
    members: ["f1", "f4", "f5"],
    expenses: ["e3"],
  },
  {
    id: "g3",
    name: "Game Night",
    description: "Weekly game night expenses",
    members: ["f1", "f2", "f4"],
    expenses: [],
  },
]

const mockExpenses: Expense[] = [
  {
    id: "e1",
    description: "Dinner at Italian Restaurant",
    amount: 120,
    paidById: "f1",
    groupId: "g1",
    splitAmong: ["f1", "f2", "f3"],
    date: "2025-03-15T18:30:00.000Z",
  },
  {
    id: "e2",
    description: "Groceries",
    amount: 85.5,
    paidById: "f2",
    groupId: "g1",
    splitAmong: ["f1", "f2", "f3"],
    date: "2025-03-12T14:45:00.000Z",
  },
  {
    id: "e3",
    description: "Museum tickets",
    amount: 60,
    paidById: "f4",
    groupId: "g2",
    splitAmong: ["f1", "f4", "f5"],
    date: "2025-03-10T10:15:00.000Z",
  },
]

type AppContextType = {
  friends: Friend[]
  groups: Group[]
  expenses: Expense[]
  addFriend: (friend: Omit<Friend, "id">) => Friend
  updateFriend: (friend: Friend) => Friend
  removeFriend: (friendId: string) => void
  addGroup: (group: Omit<Group, "id">) => Group
  updateGroup: (group: Group) => Group
  removeGroup: (groupId: string) => void
  addExpense: (expense: Omit<Expense, "id" | "date">) => Expense
  updateExpense: (expense: Expense) => Expense
  removeExpense: (expenseId: string) => void
  getBalances: () => Record<string, Record<string, number>>
  isLoading: boolean
  currentUser: Friend
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Mock current user
const mockCurrentUser: Friend = {
  id: "f1",
  name: "Jane Smith",
  email: "jane@example.com",
  avatar: "/avatar-placeholder.svg",
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser] = useState<Friend>(mockCurrentUser)

  // Initialize localStorage with mock data if empty
  const initializeLocalStorage = () => {
    const storedFriends = localStorage.getItem("fairtab_friends")
    const storedGroups = localStorage.getItem("fairtab_groups")
    const storedExpenses = localStorage.getItem("fairtab_expenses")

    if (!storedFriends) {
      localStorage.setItem("fairtab_friends", JSON.stringify(mockFriends))
    }

    if (!storedGroups) {
      localStorage.setItem("fairtab_groups", JSON.stringify(mockGroups))
    }

    if (!storedExpenses) {
      localStorage.setItem("fairtab_expenses", JSON.stringify(mockExpenses))
    }
  }

  // Load data from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      initializeLocalStorage()
      setFriends(getFriends())
      setGroups(getGroups())
      setExpenses(getExpenses())
      setIsLoading(false)
    }
  }, [])

  // Friend methods
  const addFriend = (friend: Omit<Friend, "id">) => {
    const newFriend = saveFriend({ ...friend, id: generateId() })
    setFriends(getFriends())
    return newFriend
  }

  const updateFriend = (friend: Friend) => {
    const updatedFriend = saveFriend(friend)
    setFriends(getFriends())
    return updatedFriend
  }

  const removeFriend = (friendId: string) => {
    deleteFriend(friendId)
    setFriends(getFriends())
  }

  // Group methods
  const addGroup = (group: Omit<Group, "id">) => {
    const newGroup = saveGroup({ ...group, id: generateId() } as Group)
    setGroups(getGroups())
    return newGroup
  }

  const updateGroup = (group: Group) => {
    const updatedGroup = saveGroup(group)
    setGroups(getGroups())
    return updatedGroup
  }

  const removeGroup = (groupId: string) => {
    deleteGroup(groupId)
    setGroups(getGroups())
  }

  // Expense methods
  const addExpense = (expense: Omit<Expense, "id" | "date">) => {
    const newExpense = saveExpense({
      ...expense,
      id: generateId(),
      date: new Date().toISOString(),
    })
    setExpenses(getExpenses())
    return newExpense
  }

  const updateExpense = (expense: Expense) => {
    const updatedExpense = saveExpense(expense)
    setExpenses(getExpenses())
    return updatedExpense
  }

  const removeExpense = (expenseId: string) => {
    deleteExpense(expenseId)
    setExpenses(getExpenses())
  }

  // Balance calculations
  const getBalances = () => {
    return calculateBalances()
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

