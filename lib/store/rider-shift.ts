import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RiderShiftState {
  isReadyForWork: boolean
  lastCheckInTimestamp: number | null
  checkInForWork: () => void
  checkShiftStatus: () => boolean // Returns true if ready, false if needs check-in
}

export const useRiderShiftStore = create<RiderShiftState>()(
  persist(
    (set, get) => ({
      isReadyForWork: false,
      lastCheckInTimestamp: null,
      checkInForWork: () => {
        set({ isReadyForWork: true, lastCheckInTimestamp: Date.now() })
      },
      checkShiftStatus: () => {
        const state = get()
        if (!state.isReadyForWork || !state.lastCheckInTimestamp) return false

        // Check if current time is past 7:30 AM of the current day, AND lastCheckInTimestamp was before 7:30 AM today
        const now = new Date()
        const today730AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30, 0)

        // If now is past 7:30 AM today, but last check-in was before 7:30 AM today -> shift expired!
        if (now.getTime() >= today730AM.getTime() && state.lastCheckInTimestamp < today730AM.getTime()) {
          set({ isReadyForWork: false })
          return false
        }

        // If now is before 7:30 AM today (e.g. 6 AM), check if last check-in was before 7:30 AM yesterday
        const yesterday730AM = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 7, 30, 0)
        if (now.getTime() < today730AM.getTime() && state.lastCheckInTimestamp < yesterday730AM.getTime()) {
          set({ isReadyForWork: false })
          return false
        }

        return true
      }
    }),
    {
      name: 'sawaiom-rider-shift-storage'
    }
  )
)
