"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { useEffect, useState } from "react"

export default function BalanceSummary() {
  const { friends, getBalances } = useApp()
  const [totalOwed, setTotalOwed] = useState(0)
  const [totalOwe, setTotalOwe] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const calculateBalances = async () => {
      setIsLoading(true)
      try {
        const balances = await getBalances()
        let owed = 0
        let owe = 0

        // Assuming the first friend is the current user for this example
        const currentUserId = friends[0]?.id

        if (currentUserId && balances[currentUserId]) {
          Object.entries(balances[currentUserId]).forEach(([, amount]) => {
            if (amount > 0) {
              owed += amount
            } else if (amount < 0) {
              owe += Math.abs(amount)
            }
          })
        }

        setTotalOwed(owed)
        setTotalOwe(owe)
      } catch (error) {
        console.error("Error calculating balances:", error)
      } finally {
        setIsLoading(false)
      }
    }

    calculateBalances()
  }, [friends, getBalances])

  const totalBalance = totalOwed - totalOwe

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-32"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            You are owed ${totalOwed.toFixed(2)} and you owe ${totalOwe.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-600">You are owed</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center">
          <ArrowDown className="h-4 w-4 mr-2 text-green-600" />
          <div className="text-2xl font-bold text-green-600">${totalOwed.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-600">You owe</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center">
          <ArrowUp className="h-4 w-4 mr-2 text-red-600" />
          <div className="text-2xl font-bold text-red-600">${totalOwe.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  )
}

