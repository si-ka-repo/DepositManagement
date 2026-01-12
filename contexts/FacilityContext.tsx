'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FacilityContextType {
  selectedFacilityId: number | null
  setSelectedFacilityId: (facilityId: number | null) => void
  clearSelection: () => void
  hasCompletedSelection: boolean
  markSelectionCompleted: () => void
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined)

const STORAGE_KEY = 'selectedFacilityId'
const SELECTION_COMPLETED_KEY = 'facilitySelectionCompleted'

export function FacilityProvider({ children }: { children: ReactNode }) {
  const [selectedFacilityId, setSelectedFacilityIdState] = useState<number | null>(null)
  const [hasCompletedSelection, setHasCompletedSelectionState] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // クライアントサイドでのみlocalStorageから読み込む
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const completed = localStorage.getItem(SELECTION_COMPLETED_KEY) === 'true'
    
    if (stored) {
      const facilityId = parseInt(stored, 10)
      if (!isNaN(facilityId)) {
        setSelectedFacilityIdState(facilityId)
      }
    }
    setHasCompletedSelectionState(completed)
    setIsHydrated(true)
  }, [])

  const setSelectedFacilityId = (facilityId: number | null) => {
    setSelectedFacilityIdState(facilityId)
    if (facilityId !== null) {
      localStorage.setItem(STORAGE_KEY, facilityId.toString())
      localStorage.setItem(SELECTION_COMPLETED_KEY, 'true')
      setHasCompletedSelectionState(true)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      // nullに設定しても選択完了フラグは残す（法人全体を表示する選択をしたことを記録）
    }
  }

  const clearSelection = () => {
    setSelectedFacilityIdState(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(SELECTION_COMPLETED_KEY, 'true')
    setHasCompletedSelectionState(true)
  }

  const markSelectionCompleted = () => {
    localStorage.setItem(SELECTION_COMPLETED_KEY, 'true')
    setHasCompletedSelectionState(true)
  }

  return (
    <FacilityContext.Provider
      value={{
        selectedFacilityId,
        setSelectedFacilityId,
        clearSelection,
        hasCompletedSelection,
        markSelectionCompleted,
      }}
    >
      {children}
    </FacilityContext.Provider>
  )
}

export function useFacility() {
  const context = useContext(FacilityContext)
  if (context === undefined) {
    throw new Error('useFacility must be used within a FacilityProvider')
  }
  return context
}
