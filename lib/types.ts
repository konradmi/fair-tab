"use client"

export type Group = {
  id: string
  name: string
  description?: string
  members: string[]
  expenses: string[]
}

export type Friend = {
  name: string
  email: string
  avatar?: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  paidById: string
  paidByEmail: string
  groupId: string
  splitAmong: string[]
  date: string
}

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
} 
