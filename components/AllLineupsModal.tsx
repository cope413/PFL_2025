"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X, Users, Calendar } from "lucide-react"

interface LineupData {
  teamId: string
  teamName: string
  ownerName: string
  QB: string
  RB_1: string
  WR_1: string
  FLEX_1: string
  FLEX_2: string
  TE: string
  K: string
  DEF: string
}

interface AllLineupsData {
  week: number
  lineups: LineupData[]
  totalTeams: number
  totalTeamsInLeague: number
}

interface AllLineupsModalProps {
  isOpen: boolean
  onClose: () => void
  data: AllLineupsData | null
  loading: boolean
  error: string | null
}

export function AllLineupsModal({ isOpen, onClose, data, loading, error }: AllLineupsModalProps) {
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle>All Lineups - Week {data?.week || '...'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading lineups...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle>All Lineups - Week {data?.week || '...'}</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  if (!data) {
    return null
  }

  const { week, lineups, totalTeams, totalTeamsInLeague } = data

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Lineups - Week {week}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Week {week}</span>
              </div>
              <Badge variant="outline">
                {totalTeams} of {totalTeamsInLeague} teams submitted
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Lineups */}
          {lineups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No lineups submitted for Week {week}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {lineups.map((lineup) => (
                <div key={lineup.teamId} className="border border-border rounded-lg p-3">
                  <div className="mb-3">
                    <h3 className="font-semibold text-base">{lineup.teamName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {lineup.ownerName} ({lineup.teamId})
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">QB:</span>
                      <span>{lineup.QB || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">RB:</span>
                      <span>{lineup.RB_1 || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">WR:</span>
                      <span>{lineup.WR_1 || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">TE:</span>
                      <span>{lineup.TE || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">FLEX 1:</span>
                      <span>{lineup.FLEX_1 || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">FLEX 2:</span>
                      <span>{lineup.FLEX_2 || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">K:</span>
                      <span>{lineup.K || 'Empty'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-muted-foreground w-16">D/ST:</span>
                      <span>{lineup.DEF || 'Empty'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
