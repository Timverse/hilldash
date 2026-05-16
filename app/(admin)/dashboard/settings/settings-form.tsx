"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { updateSettingsAction } from "@/app/actions/settings"

export function SettingsForm({ initialSettings }: { initialSettings: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentLogo = initialSettings.find(s => s.key === 'site_logo')?.value
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo || null)

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
    const result = await updateSettingsAction(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Settings updated successfully")
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl border shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Brand Logo</h3>
          <p className="text-sm text-slate-500">Upload your company logo to display on the Customer Navbar and Footer.</p>
        </div>

        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-xl border-2 border-dashed bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative shrink-0">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">Upload Logo</span>
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
            <p className="text-sm font-medium text-slate-700">Logo Requirements:</p>
            <ul className="text-sm text-slate-500 list-disc pl-4 space-y-1">
              <li>Transparent background (PNG recommended)</li>
              <li>Maximum file size: 2MB</li>
              <li>Recommended resolution: 512x512px</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-primary text-white font-bold">
          {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
