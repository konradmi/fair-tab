"use client"

import type React from "react"

import { useState } from "react"
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

  const handleExport = async () => {
    if (!userEmail) {
      toast.error("You must be logged in to export data")
      return
    }
    
    setIsLoading(true)
    try {
      const groups = await db.getAllGroups(userEmail)
      const friends = await db.getAllFriends(userEmail)
      const expenses = await db.getAllExpenses(userEmail)

      const data = {
        groups,
        friends, 
        expenses
      }

      const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userEmail) return

    setIsLoading(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        const database = await db.getDb()
        
        const existingGroups = await db.getAllGroups(userEmail)
        const existingFriends = await db.getAllFriends(userEmail)
        const existingExpenses = await db.getAllExpenses(userEmail)
        
        for (const group of existingGroups) {
          if (group.ownerEmail === userEmail) {
            await database.groups.delete(group.id)
          }
        }
        
        for (const friend of existingFriends) {
          if (friend.ownerEmail === userEmail) {
            await database.friends.delete(friend.email)
          }
        }
        
        for (const expense of existingExpenses) {
          if (expense.ownerEmail === userEmail) {
            await database.expenses.delete(expense.id)
          }
        }
        
        if (data.friends && Array.isArray(data.friends)) {
          for (const friend of data.friends as Friend[]) {
            friend.ownerEmail = userEmail
            if (!friend.accessibleTo) friend.accessibleTo = []
            if (!friend.accessibleTo.includes(userEmail)) {
              friend.accessibleTo.push(userEmail)
            }
            await db.saveFriend(friend, userEmail)
          }
        }
        
        if (data.groups && Array.isArray(data.groups)) {
          for (const group of data.groups as Group[]) {
            group.ownerEmail = userEmail
            if (!group.members.includes(userEmail)) {
              group.members.push(userEmail)
            }
            await db.saveGroup(group, userEmail)
          }
        }
        
        if (data.expenses && Array.isArray(data.expenses)) {
          for (const expense of data.expenses as Expense[]) {
            expense.ownerEmail = userEmail
            await db.saveExpense(expense, userEmail)
          }
        }

        toast.success("Data imported successfully", {
          description: "Your data has been imported. Please refresh the page.",
        })

        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        console.error("Import error:", error)
        toast.error("Import failed", {
          description: "There was an error importing your data. Please check the file format.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    reader.readAsText(file)
    setImportDialogOpen(false)
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

