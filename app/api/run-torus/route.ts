import { type NextRequest, NextResponse } from "next/server"

// Global state to track the game process
const gameState = {
  isRunning: false,
  isPaused: false,
  settings: {
    fps: 60,
    rotation_speed: 1,
    color_speed: 1,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, fps, rotation_speed, color_speed } = body

    switch (action) {
      case "start":
        if (gameState.isRunning) {
          return NextResponse.json({
            success: false,
            message: "Game is already running!",
          })
        }

        gameState.isRunning = true
        gameState.isPaused = false
        gameState.settings = { fps: fps || 60, rotation_speed: rotation_speed || 1, color_speed: color_speed || 1 }

        // In a real implementation, you would spawn the Python process here
        // For demo purposes, we'll simulate the game starting
        setTimeout(() => {
          // Simulate game execution
        }, 100)

        return NextResponse.json({
          success: true,
          message: `🎮 Game started! FPS: ${gameState.settings.fps}, Rotation: ${gameState.settings.rotation_speed}x, Colors: ${gameState.settings.color_speed}x`,
        })

      case "pause":
        if (!gameState.isRunning) {
          return NextResponse.json({
            success: false,
            message: "Game is not running!",
          })
        }

        gameState.isPaused = true
        return NextResponse.json({
          success: true,
          message: "⏸️ Game paused",
        })

      case "resume":
        if (!gameState.isRunning) {
          return NextResponse.json({
            success: false,
            message: "Game is not running!",
          })
        }

        gameState.isPaused = false
        return NextResponse.json({
          success: true,
          message: "▶️ Game resumed",
        })

      case "stop":
        gameState.isRunning = false
        gameState.isPaused = false
        return NextResponse.json({
          success: true,
          message: "🛑 Game stopped",
        })

      case "update":
        if (!gameState.isRunning) {
          return NextResponse.json({
            success: false,
            message: "Game is not running!",
          })
        }

        gameState.settings = {
          fps: fps || gameState.settings.fps,
          rotation_speed: rotation_speed || gameState.settings.rotation_speed,
          color_speed: color_speed || gameState.settings.color_speed,
        }

        return NextResponse.json({
          success: true,
          message: `⚙️ Settings updated - FPS: ${gameState.settings.fps}, Rotation: ${gameState.settings.rotation_speed}x, Colors: ${gameState.settings.color_speed}x`,
        })

      default:
        return NextResponse.json({
          success: false,
          message: "Invalid action",
        })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Server error: " + error,
    })
  }
}

export async function GET() {
  return NextResponse.json({
    gameState,
    message: "Torus Game API is running",
  })
}
