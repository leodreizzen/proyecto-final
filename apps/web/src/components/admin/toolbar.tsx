"use client"

import { Search, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function Toolbar({ searchQuery, onSearchChange }: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por ID, año..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Upload button */}
      <Button className="gap-2 shrink-0">
        <Upload className="h-4 w-4" />
        <span>Subir PDF</span>
      </Button>
    </div>
  )
}
