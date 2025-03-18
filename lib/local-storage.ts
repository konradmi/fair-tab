"use client"

export type Group = {
  id: string
  name: string
  description?: string
  members: string[]
  expenses: string[]
  // other properties
}

export type Friend = {
  id: string
  name: string
  email: string
  avatar?: string
  // other properties
}

export type Expense = {
  id: string
  description: string
  amount: number
  paidById: string
  groupId: string
  splitAmong: string[]
  date: string
  // other properties
}

// Helper function to generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 9)

// Storage keys
const GROUPS_KEY = "fairtab_groups"
const FRIENDS_KEY = "fairtab_friends"
const EXPENSES_KEY = "fairtab_expenses"

// Groups
export const getGroups = (): Group[] => {
  if (typeof window === "undefined") return []
  const groups = localStorage.getItem(GROUPS_KEY)
  return groups ? JSON.parse(groups) : []
}

export const saveGroup = (group: Group) => {
  const groups = getGroups()
  const existingIndex = groups.findIndex((g) => g.id === group.id)

  if (existingIndex >= 0) {
    groups[existingIndex] = group
  } else {
    groups.push({
      ...group,
      id: group.id || generateId(),
    })
  }

  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
  return group
}

export const deleteGroup = (groupId: string) => {
  const groups = getGroups().filter((g) => g.id !== groupId)
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

// Friends
export const getFriends = (): Friend[] => {
  if (typeof window === "undefined") return []
  const friends = localStorage.getItem(FRIENDS_KEY)
  return friends ? JSON.parse(friends) : []
}

export const saveFriend = (friend: Friend) => {
  const friends = getFriends()
  const existingIndex = friends.findIndex((f) => f.id === friend.id)

  if (existingIndex >= 0) {
    friends[existingIndex] = friend
  } else {
    friends.push({
      ...friend,
      id: friend.id || generateId(),
    })
  }

  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends))
  return friend
}

export const deleteFriend = (friendId: string) => {
  const friends = getFriends().filter((f) => f.id !== friendId)
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends))
}

// Expenses
export const getExpenses = (): Expense[] => {
  if (typeof window === "undefined") return []
  const expenses = localStorage.getItem(EXPENSES_KEY)
  return expenses ? JSON.parse(expenses) : []
}

export const saveExpense = (expense: Expense) => {
  const expenses = getExpenses()
  const existingIndex = expenses.findIndex((e) => e.id === expense.id)

  if (existingIndex >= 0) {
    expenses[existingIndex] = expense
  } else {
    expenses.push({
      ...expense,
      id: expense.id || generateId(),
      date: expense.date || new Date().toISOString(),
    })
  }

  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
  return expense
}

export const deleteExpense = (expenseId: string) => {
  const expenses = getExpenses().filter((e) => e.id !== expenseId)
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
}

// Calculate balances
export const calculateBalances = () => {
  const expenses = getExpenses()
  const friends = getFriends()
  const balances: Record<string, Record<string, number>> = {}

  // Initialize balances
  friends.forEach((friend) => {
    balances[friend.id] = {}
    friends.forEach((otherFriend) => {
      if (friend.id !== otherFriend.id) {
        balances[friend.id][otherFriend.id] = 0
      }
    })
  })

  // Calculate balances from expenses
  expenses.forEach((expense) => {
    const paidBy = expense.paidById
    const splitAmong = expense.splitAmong
    const amountPerPerson = expense.amount / splitAmong.length

    splitAmong.forEach((personId) => {
      if (personId !== paidBy) {
        // Person owes money to paidBy
        balances[personId][paidBy] = (balances[personId][paidBy] || 0) + amountPerPerson
        // Negative balance means paidBy owes money to person
        balances[paidBy][personId] = (balances[paidBy][personId] || 0) - amountPerPerson
      }
    })
  })

  return balances
}

