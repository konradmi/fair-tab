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
import { toast } from "@/hooks/use-toast"
import { Download, Upload } from "lucide-react"

export function DataExportImport() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const handleExport = () => {
    try {
      const data = {
        groups: localStorage.getItem("fairtab_groups"),
        friends: localStorage.getItem("fairtab_friends"),
        expenses: localStorage.getItem("fairtab_expenses"),
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

      toast({
        title: "Data exported successfully",
        description: "Your data has been exported to a JSON file.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
      })
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.groups) localStorage.setItem("fairtab_groups", data.groups)
        if (data.friends) localStorage.setItem("fairtab_friends", data.friends)
        if (data.expenses) localStorage.setItem("fairtab_expenses", data.expenses)

        toast({
          title: "Data imported successfully",
          description: "Your data has been imported. Please refresh the page.",
        })

        // Refresh the page to load the new data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        toast({
          title: "Import failed",
          description: "There was an error importing your data. Please check the file format.",
        })
      }
    }

    reader.readAsText(file)
    setImportDialogOpen(false)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export Data
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
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

