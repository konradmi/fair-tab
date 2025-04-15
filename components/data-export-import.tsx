"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Download, Upload } from "lucide-react"
import * as db from "@/lib/indexed-db"
import { type Expense, type Friend, type Group } from "@/lib/types"
import { useAppAuth } from "@/hooks/useAppAuth"

export function DataExportImport() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { userEmail } = useAppAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  useEffect(() => {
    const loadData = async () => {
      if (!userEmail) return
      setFriends(await db.getAllFriends(userEmail))
      setGroups(await db.getAllGroups(userEmail))
      setExpenses(await db.getAllExpenses(userEmail))
    }
    loadData()
  }, [userEmail])

  const handleExport = async () => {
    if (!userEmail) {
      toast.error("You must be logged in to export data")
      return
    }
    
    setIsLoading(true)
    try {
      const data = {
        friends,
        groups,
        expenses
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fairtab-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully", {
        description: "Your data has been exported to a JSON file.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Export failed", {
        description: "There was an error exporting your data.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !userEmail) return
    
    try {
      const file = event.target.files[0]
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Import friends
      if (data.friends?.length) {
        for (const friend of data.friends) {
          friend.ownerEmail = userEmail
          await db.saveFriend(friend, userEmail)
        }
      }
      
      // Import groups
      if (data.groups?.length) {
        for (const group of data.groups) {
          group.ownerEmail = userEmail
          if (!group.members.includes(userEmail)) {
            group.members.push(userEmail)
          }
          await db.saveGroup(group, userEmail)
        }
      }
      
      // Import expenses
      if (data.expenses?.length) {
        for (const expense of data.expenses) {
          expense.ownerEmail = userEmail
          await db.saveExpense(expense, userEmail)
        }
      }
      
      // Refresh data
      setFriends(await db.getAllFriends(userEmail))
      setGroups(await db.getAllGroups(userEmail))
      setExpenses(await db.getAllExpenses(userEmail))
      
      toast.success('Data imported successfully')
    } catch (error) {
      console.error('Error importing data:', error)
      toast.error('Error importing data')
    }
    
    event.target.value = ''
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExport} 
        disabled={isLoading || !userEmail}
      >
        <Download className="mr-2 h-4 w-4" />
        {isLoading ? "Exporting..." : "Export Data"}
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoading || !userEmail}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Importing..." : "Import Data"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              This will replace your current data. Make sure to export your current data first if you want to keep it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input type="file" accept=".json" onChange={handleImport} className="w-full" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

