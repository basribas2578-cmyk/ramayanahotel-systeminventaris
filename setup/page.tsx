"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { setupDatabase } from "@/scripts/setup-database"
import { deployToVercel } from "@/scripts/auto-deploy"

interface SetupStep {
  id: string
  title: string
  description: string
  status: "pending" | "running" | "completed" | "error"
  error?: string
}

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState("")
  const [config, setConfig] = useState({
    supabaseUrl: "",
    supabaseKey: "",
    supabasePassword: "",
    projectName: "hotel-inventory-system",
  })

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "validate",
      title: "Validasi Konfigurasi",
      description: "Memvalidasi URL dan API key Supabase",
      status: "pending",
    },
    {
      id: "database",
      title: "Setup Database",
      description: "Membuat tabel dan mengisi data sample",
      status: "pending",
    },
    {
      id: "deploy",
      title: "Deploy ke Vercel",
      description: "Deploy aplikasi ke Vercel",
      status: "pending",
    },
    {
      id: "complete",
      title: "Setup Selesai",
      description: "Aplikasi siap digunakan",
      status: "pending",
    },
  ])

  const updateStepStatus = (stepId: string, status: SetupStep["status"], error?: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status, error } : step)))
  }

  const runSetup = async () => {
    setIsRunning(true)
    setCurrentStep(0)

    try {
      // Step 1: Validate configuration
      updateStepStatus("validate", "running")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error("URL dan API Key Supabase harus diisi")
      }

      updateStepStatus("validate", "completed")
      setCurrentStep(1)

      // Step 2: Setup database
      updateStepStatus("database", "running")
      const dbResult = await setupDatabase(config)

      if (!dbResult) {
        throw new Error("Gagal setup database")
      }

      updateStepStatus("database", "completed")
      setCurrentStep(2)

      // Step 3: Deploy to Vercel
      updateStepStatus("deploy", "running")
      const deployResult = await deployToVercel(config)

      if (!deployResult.success) {
        throw new Error(deployResult.error || "Gagal deploy ke Vercel")
      }

      setDeploymentUrl(deployResult.url || "")
      updateStepStatus("deploy", "completed")
      setCurrentStep(3)

      // Step 4: Complete
      updateStepStatus("complete", "completed")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      updateStepStatus(steps[currentStep].id, "error", errorMessage)
    } finally {
      setIsRunning(false)
    }
  }

  const progress = (steps.filter((s) => s.status === "completed").length / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏨 Hotel Inventory System</h1>
          <p className="text-xl text-gray-600">Setup Otomatis - Siap dalam 5 menit!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">⚙️ Konfigurasi</CardTitle>
              <CardDescription>Masukkan informasi Supabase Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supabaseUrl">Supabase Project URL</Label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://your-project.supabase.co"
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, supabaseUrl: e.target.value }))}
                  disabled={isRunning}
                />
              </div>

              <div>
                <Label htmlFor="supabaseKey">Supabase API Key (anon/public)</Label>
                <Input
                  id="supabaseKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={config.supabaseKey}
                  onChange={(e) => setConfig((prev) => ({ ...prev, supabaseKey: e.target.value }))}
                  disabled={isRunning}
                />
              </div>

              <div>
                <Label htmlFor="projectName">Nama Project (opsional)</Label>
                <Input
                  id="projectName"
                  placeholder="hotel-inventory-system"
                  value={config.projectName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, projectName: e.target.value }))}
                  disabled={isRunning}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cara mendapatkan informasi Supabase:</strong>
                  <br />
                  1. Buka{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    supabase.com
                  </a>
                  <br />
                  2. Login dan buat project baru
                  <br />
                  3. Di Settings → API, copy URL dan anon key
                </AlertDescription>
              </Alert>

              <Button
                onClick={runSetup}
                disabled={isRunning || !config.supabaseUrl || !config.supabaseKey}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setup Berjalan...
                  </>
                ) : (
                  "🚀 Mulai Setup Otomatis"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📊 Progress Setup</CardTitle>
              <CardDescription>Ikuti progress setup otomatis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      {step.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {step.status === "running" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                      {step.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {step.status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {step.error && <p className="text-sm text-red-600 mt-1">{step.error}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {deploymentUrl && (
                <Alert className="mt-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>🎉 Setup Berhasil!</strong>
                    <br />
                    Aplikasi Anda tersedia di:
                    <br />
                    <a
                      href={deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2"
                    >
                      {deploymentUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🆘 Butuh Bantuan?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">📋 Persiapan</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Akun Supabase gratis</li>
                  <li>• Project Supabase baru</li>
                  <li>• URL dan API key</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">⚡ Fitur</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Setup database otomatis</li>
                  <li>• Data sample lengkap</li>
                  <li>• Deploy ke Vercel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔐 Login</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Admin: admin@hotel.com</li>
                  <li>• Manager: manager@hotel.com</li>
                  <li>• Staff: staff@hotel.com</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
