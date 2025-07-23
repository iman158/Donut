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
    ctx.fillStyle = "#111111"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2
    const angle = angleRef.current
    const frameCount = frameCountRef.current

    console.log(`Drawing frame ${frameCount}, angle: ${angle.toFixed(2)}`)

    // Draw rotating line (simple test)
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + 100 * Math.cos(angle), centerY + 100 * Math.sin(angle))
    ctx.stroke()

    // Draw rotating dot
    const dotX = centerX + 150 * Math.cos(angle * 2)
    const dotY = centerY + 150 * Math.sin(angle * 2)
    ctx.fillStyle = "#ff0000"
    ctx.beginPath()
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2)
    ctx.fill()

    // Draw simple torus-like pattern
    ctx.font = "14px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const chars = " .:-=+*#%@"

    for (let i = 0; i < 50; i++) {
      const theta = (i / 50) * Math.PI * 2
      const radius = 120 + 40 * Math.sin(theta * 3 + angle * 3)

      const x = centerX + radius * Math.cos(theta + angle)
      const y = centerY + radius * Math.sin(theta + angle) * 0.6

      const charIndex = Math.floor((Math.sin(theta * 2 + angle * 2) + 1) * 0.5 * (chars.length - 1))
      const char = chars[charIndex]

      // Color
      const hue = (theta + angle) * 0.5
      const intensity = colorIntensity[0]
      const r = Math.floor(128 + 100 * Math.sin(hue) * intensity)
      const g = Math.floor(128 + 100 * Math.sin(hue + 2) * intensity)
      const b = Math.floor(128 + 100 * Math.sin(hue + 4) * intensity)

      ctx.fillStyle = `rgb(${Math.max(50, Math.min(255, r))}, ${Math.max(50, Math.min(255, g))}, ${Math.max(50, Math.min(255, b))})`
      ctx.fillText(char, x, y)
    }

    // Status text
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px monospace"
    ctx.fillText(`FRAME: ${frameCount}`, centerX, 50)
    ctx.fillText(`ANGLE: ${Math.floor((angle * 180) / Math.PI)}°`, centerX, 70)
    ctx.fillText(`SPEED: ${rotationSpeed[0]}x`, centerX, 90)

    // Update for next frame
    angleRef.current += 0.05 * rotationSpeed[0]
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
          <h1 className="text-4xl font-light text-slate-100 mb-3 tracking-wide">3D Torus Animation Test</h1>
          <p className="text-slate-400 text-lg font-light">Simple animation with rotating elements</p>
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
              <CardTitle className="text-slate-100 text-lg font-medium">Animation Test</CardTitle>
              <CardDescription className="text-slate-400 font-light">
                {isRunning
                  ? isPaused
                    ? "Animation paused - click resume to continue"
                    : "Animation running - you should see rotating elements"
                  : "Ready to start - click play button"}
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
