"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, RotateCcw, Settings, Activity } from "lucide-react"

export default function TorusGamePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState([30])
  const [rotationSpeed, setRotationSpeed] = useState([1])
  const [colorIntensity, setColorIntensity] = useState([0.5])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const angleRef = useRef(0)
  const frameCountRef = useRef(0)

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600

  const drawFrame = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log("No canvas found!")
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.log("No context found!")
      return
    }

    // Clear canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2
    const A = angleRef.current
    const B = angleRef.current * 0.5
    const frameCount = frameCountRef.current

    console.log(`Drawing frame ${frameCount}, A: ${A.toFixed(2)}, B: ${B.toFixed(2)}`)

    // Donut parameters (same as your Python code)
    const R1 = 1 // Minor radius
    const R2 = 2 // Major radius
    const K2 = 5 // Distance from viewer
    const screen_width = 80
    const screen_height = 60
    const K1 = (screen_height * K2 * 3) / (8 * (R1 + R2))

    const chars = ".,-~:;=!*#$@"
    const output = new Array(screen_width * screen_height).fill(" ")
    const zbuffer = new Array(screen_width * screen_height).fill(0)

    // Generate 3D donut (exact same math as your Python code)
    for (let theta = 0; theta < 628; theta += 10) {
      // theta goes around the cross-sectional circle
      for (let phi = 0; phi < 628; phi += 3) {
        // phi goes around the center of revolution
        const cosA = Math.cos(A)
        const sinA = Math.sin(A)
        const cosB = Math.cos(B)
        const sinB = Math.sin(B)
        const costheta = Math.cos(theta / 100)
        const sintheta = Math.sin(theta / 100)
        const cosphi = Math.cos(phi / 100)
        const sinphi = Math.sin(phi / 100)

        // x, y coordinates before revolving
        const circlex = R2 + R1 * costheta
        const circley = R1 * sintheta

        // 3D (x, y, z) coordinates after rotation
        const x = circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * cosA * sinB
        const y = circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * cosB
        const z = K2 + cosA * circlex * sinphi + circley * sinA

        const ooz = 1 / z // one over z

        // x, y projection
        const xp = Math.floor(screen_width / 2 + K1 * ooz * x)
        const yp = Math.floor(screen_height / 2 - K1 * ooz * y)

        if (xp >= 0 && xp < screen_width && yp >= 0 && yp < screen_height) {
          const position = xp + screen_width * yp

          // luminance (L ranges from -sqrt(2) to sqrt(2))
          const L =
            cosphi * costheta * sinB -
            cosA * costheta * sinphi -
            sinA * sintheta +
            cosB * (cosA * sintheta - costheta * sinA * sinphi)

          if (ooz > zbuffer[position]) {
            zbuffer[position] = ooz // larger ooz means closer to viewer
            const luminance_index = Math.floor(L * 8) // multiply by 8 to get range 0..11
            output[position] = chars[Math.max(0, Math.min(chars.length - 1, luminance_index))]
          }
        }
      }
    }

    // Render the donut using ASCII characters
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const pixel_width = CANVAS_WIDTH / screen_width
    const pixel_height = CANVAS_HEIGHT / screen_height

    for (let i = 0; i < screen_height; i++) {
      for (let j = 0; j < screen_width; j++) {
        const char = output[j + screen_width * i]
        if (char !== " ") {
          const x = j * pixel_width + pixel_width / 2
          const y = i * pixel_height + pixel_height / 2

          // Color based on character brightness and rotation
          const brightness = chars.indexOf(char) / chars.length
          const hue = (A + brightness) * 0.1
          const intensity = colorIntensity[0]

          const r = Math.floor(128 + 100 * Math.sin(hue) * intensity + 50 * brightness)
          const g = Math.floor(128 + 100 * Math.sin(hue + 2) * intensity + 50 * brightness)
          const b = Math.floor(128 + 100 * Math.sin(hue + 4) * intensity + 50 * brightness)

          ctx.fillStyle = `rgb(${Math.max(50, Math.min(255, r))}, ${Math.max(50, Math.min(255, g))}, ${Math.max(50, Math.min(255, b))})`
          ctx.fillText(char, x, y)
        }
      }
    }

    // Status text
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px monospace"
    ctx.fillText(`3D DONUT - FRAME: ${frameCount}`, centerX, 30)
    ctx.fillText(`ROTATION: ${Math.floor((A * 180) / Math.PI)}°`, centerX, CANVAS_HEIGHT - 30)

    // Update rotation angles (same as your Python code)
    angleRef.current += 0.15 * rotationSpeed[0] // A += 0.15
    frameCountRef.current += 1
  }

  const startAnimation = () => {
    console.log("Starting animation...")
    setIsRunning(true)
    setIsPaused(false)

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Reset counters
    angleRef.current = 0
    frameCountRef.current = 0

    // Start animation loop using setInterval (more reliable than requestAnimationFrame)
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        drawFrame()
      }
    }, 1000 / speed[0])

    // Draw first frame immediately
    drawFrame()
  }

  const pauseAnimation = () => {
    console.log("Toggling pause...")
    setIsPaused(!isPaused)
  }

  const stopAnimation = () => {
    console.log("Stopping animation...")
    setIsRunning(false)
    setIsPaused(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Draw stopped state
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#111111"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = "#666666"
        ctx.font = "24px monospace"
        ctx.textAlign = "center"
        ctx.fillText("ANIMATION STOPPED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        ctx.fillText("Click PLAY to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
      }
    }
  }

  const resetAnimation = () => {
    console.log("Resetting...")
    stopAnimation()
    setSpeed([30])
    setRotationSpeed([1])
    setColorIntensity([0.5])
    angleRef.current = 0
    frameCountRef.current = 0
  }

  // Update speed when slider changes
  useEffect(() => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          drawFrame()
        }
      }, 1000 / speed[0])
    }
  }, [speed, isPaused, isRunning])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        console.log("Canvas initialized successfully!")

        // Draw initial state
        ctx.fillStyle = "#111111"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = "#ffffff"
        ctx.font = "24px monospace"
        ctx.textAlign = "center"
        ctx.fillText("READY TO ANIMATE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        ctx.fillText("Click PLAY to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)

        // Draw test border
        ctx.strokeStyle = "#333333"
        ctx.lineWidth = 2
        ctx.strokeRect(5, 5, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10)
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-slate-100 mb-3 tracking-wide">3D Donut Visualization</h1>
          <p className="text-slate-400 text-lg font-light">
            Rotating ASCII donut - just like the original Python version
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Control Panel */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-100 flex items-center gap-2 text-lg font-medium">
                <Settings className="w-5 h-5" />
                Animation Controls
              </CardTitle>
              <CardDescription className="text-slate-400 font-light">
                Test basic animation functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Controls */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={startAnimation}
                  disabled={isRunning}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Play className="w-3 h-3" />
                </Button>

                <Button
                  onClick={pauseAnimation}
                  disabled={!isRunning}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </Button>

                <Button
                  onClick={stopAnimation}
                  disabled={!isRunning}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  <Square className="w-3 h-3" />
                </Button>
              </div>

              {/* Speed Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-sm font-medium">Frame Rate</label>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-200 font-mono">
                    {speed[0]} fps
                  </Badge>
                </div>
                <Slider value={speed} onValueChange={setSpeed} max={60} min={5} step={5} className="w-full" />
              </div>

              {/* Rotation Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-sm font-medium">Rotation Speed</label>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-200 font-mono">
                    {rotationSpeed[0]}×
                  </Badge>
                </div>
                <Slider
                  value={rotationSpeed}
                  onValueChange={setRotationSpeed}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Color Intensity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-sm font-medium">Color Intensity</label>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-200 font-mono">
                    {Math.round(colorIntensity[0] * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={colorIntensity}
                  onValueChange={setColorIntensity}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Reset Button */}
              <Button
                onClick={resetAnimation}
                variant="outline"
                size="sm"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {/* Status */}
              <div className="flex items-center justify-center pt-2">
                <Badge
                  variant={isRunning ? (isPaused ? "secondary" : "default") : "outline"}
                  className={`text-xs font-medium ${
                    isRunning
                      ? isPaused
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  <Activity className="w-3 h-3 mr-1" />
                  {isRunning ? (isPaused ? "Paused" : "Running") : "Stopped"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Animation Canvas */}
          <Card className="xl:col-span-3 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-100 text-lg font-medium">3D Donut Animation</CardTitle>
              <CardDescription className="text-slate-400 font-light">
                {isRunning
                  ? isPaused
                    ? "Donut paused - click resume to continue spinning"
                    : "3D donut spinning - exact same math as your Python code!"
                  : "Ready to spin the donut - click play button"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border border-slate-600/50 rounded-lg bg-slate-900 shadow-2xl"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card className="mt-6 bg-slate-800/30 border-slate-700/30 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center text-slate-400">
              <p className="text-sm mb-2">
                <strong>Debug Info:</strong> Check browser console (F12) for detailed logs
              </p>
              <p className="text-xs">
                You should see: Rotating green line, red dot moving in circle, and animated ASCII characters forming a
                torus-like pattern
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
