import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedAddress {
  id: string
  title: string // e.g. "Home", "Work", "Other"
  address: string // Complete street address
  locality: string // e.g. "Mookyrdup", "Ladthadlaboh"
  lat: number
  lng: number
  notes?: string
  isDefault?: boolean
}

interface AddressState {
  addresses: SavedAddress[]
  activeAddressId: string | null
  addAddress: (address: Omit<SavedAddress, 'id'>) => void
  updateAddress: (id: string, address: Partial<SavedAddress>) => void
  deleteAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  setActiveAddress: (id: string) => void
  getActiveAddress: () => SavedAddress | null
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [
        {
          id: 'default-jowai',
          title: 'Home',
          address: 'Jowai Central Hub Area, Mission Compound',
          locality: 'Mission Compound',
          lat: 25.4550,
          lng: 92.1950,
          notes: 'Near Main Gate',
          isDefault: true
        }
      ],
      activeAddressId: 'default-jowai',
      addAddress: (newAddr) => {
        const id = `addr-${Date.now()}`
        set((state) => {
          const isFirst = state.addresses.length === 0
          const updated = [...state.addresses, { ...newAddr, id, isDefault: isFirst || newAddr.isDefault }]
          if (newAddr.isDefault || isFirst) {
            return {
              addresses: updated.map(a => ({ ...a, isDefault: a.id === id })),
              activeAddressId: id
            }
          }
          return { addresses: updated, activeAddressId: id }
        })
      },
      updateAddress: (id, updatedFields) => {
        set((state) => ({
          addresses: state.addresses.map((a) => (a.id === id ? { ...a, ...updatedFields } : a))
        }))
      },
      deleteAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id)
          let newActive = state.activeAddressId
          if (newActive === id) {
            newActive = filtered.length > 0 ? filtered[0].id : null
          }
          if (filtered.length > 0 && !filtered.find(a => a.isDefault)) {
            filtered[0].isDefault = true
          }
          return { addresses: filtered, activeAddressId: newActive }
        })
      },
      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
          activeAddressId: id
        }))
      },
      setActiveAddress: (id) => {
        set({ activeAddressId: id })
      },
      getActiveAddress: () => {
        const state = get()
        if (!state.activeAddressId) {
          return state.addresses.length > 0 ? state.addresses[0] : null
        }
        return state.addresses.find(a => a.id === state.activeAddressId) || (state.addresses.length > 0 ? state.addresses[0] : null)
      }
    }),
    {
      name: 'sawaiom-addresses-storage',
    }
  )
)
