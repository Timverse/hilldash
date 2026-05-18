"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Upload, Zap, DollarSign } from "lucide-react"
import { updateSettingsAction } from "@/app/actions/settings"

export function SettingsForm({ initialSettings }: { initialSettings: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentLogo = initialSettings.find(s => s.key === 'site_logo')?.value
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo || null)

  // Emergency Delivery Settings State
  const initialEmergencyEnabled = initialSettings.find(s => s.key === 'emergency_delivery_enabled')?.value === 'true'
  const initialEmergencyFee = initialSettings.find(s => s.key === 'emergency_delivery_fee')?.value || '20'
  const [emergencyEnabled, setEmergencyEnabled] = useState(initialEmergencyEnabled)
  const [emergencyFee, setEmergencyFee] = useState(initialEmergencyFee)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(currentLogo || null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.set('emergency_delivery_enabled', emergencyEnabled ? 'true' : 'false')
    formData.set('emergency_delivery_fee', emergencyFee)

    const result = await updateSettingsAction(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Settings updated successfully")
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm font-sans antialiased">
      {/* Brand Logo Section */}
      <div className="space-y-6 pb-8 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Brand Logo</h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Upload your company logo to display on the Customer Navbar and Footer.</p>
        </div>

        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-2xl border-2 border-dashed bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative shrink-0 shadow-inner">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold">Upload Logo</span>
              </div>
            )}
            <input 
              type="file" 
              name="logo"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-bold text-slate-700">Logo Requirements:</p>
            <ul className="text-xs text-slate-500 list-disc pl-4 space-y-1.5 font-medium">
              <li>Transparent background (PNG recommended)</li>
              <li>Maximum file size: 2MB</li>
              <li>Recommended resolution: 512x512px</li>
            </ul>
          </div>
        </div>
      </div>

      {/* EMERGENCY DELIVERY SECTION */}
      <div className="space-y-6 pb-8 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Emergency Delivery Mode</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Enable Swiggy Genie / Blinkit lightning fast delivery (15-20 Mins).</p>
            </div>
          </div>
          <Switch 
            checked={emergencyEnabled} 
            onCheckedChange={setEmergencyEnabled} 
          />
        </div>

        {emergencyEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-4 md:pl-6 border-l-2 border-amber-200 ml-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Emergency Delivery Fee (₹)
              </label>
              <Input 
                type="number"
                value={emergencyFee}
                onChange={(e) => setEmergencyFee(e.target.value)}
                placeholder="20" 
                className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:bg-white transition-all px-6 text-lg font-black text-slate-900 shadow-inner" 
              />
              <p className="text-xs text-slate-400 font-medium px-1">Extra fee added to checkout when emergency delivery is selected.</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-xl shadow-primary/20 transition-all active:scale-95">
          {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Changes...</> : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
