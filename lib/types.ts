"use client"

export type Group = {
  id: string
  name: string
  description?: string
  members: string[]
  expenses: string[]
}

export type Friend = {
  id: string
  name: string
  email: string
  avatar?: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  paidById: string
  groupId: string
  splitAmong: string[]
  date: string
}

// Helper function to generate IDs
export const generateId = (): string => Math.random().toString(36).substring(2, 9); 
