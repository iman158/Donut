import os
import sys
import json
from math import cos, sin
import pygame
import colorsys
import threading
import time

class TorusGame:
    def __init__(self):
        # Color constants
        self.WHITE = (255, 255, 255)
        self.BLACK = (0, 0, 0)
        
        # Game state
        self.hue = 0
        self.running = False
        self.paused = False
        
        # Settings (can be modified via web interface)
        self.fps = 60
        self.rotation_speed = 1.0
        self.color_speed = 1.0
        
        # Display settings
        os.environ['SDL_VIDEO_CENTERED'] = '1'
        self.RES = self.WIDTH, self.HEIGHT = 400, 400
        self.pixel_width = 20
        self.pixel_height = 20
        self.x_pixel = 0
        self.y_pixel = 0
        
        # Screen calculations
        self.screen_width = self.WIDTH // self.pixel_width
        self.screen_height = self.HEIGHT // self.pixel_height
        self.screen_size = self.screen_width * self.screen_height
        
        # Torus parameters
        self.A, self.B = 0, 0
        self.theta_spacing = 10
        self.phi_spacing = 3
        self.chars = ".,-~:;=!*#$@"
        self.R1 = 10
        self.R2 = 20
        self.K2 = 200
        self.K1 = self.screen_height * self.K2 * 3 / (8 * (self.R1 + self.R2))
        
        # Pygame initialization
        pygame.init()
        self.screen = pygame.display.set_mode(self.RES)
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont('Arial', 20, bold=True)
        
    def hsv2rgb(self, h, s, v):
        """Convert HSV to RGB color space"""
        return tuple(round(i * 255) for i in colorsys.hsv_to_rgb(h, s, v))
    
    def text_display(self, char, x, y):
        """Display text character at given position with current hue"""
        text = self.font.render(str(char), True, self.hsv2rgb(self.hue, 1, 1))
        text_rect = text.get_rect(center=(x, y))
        self.screen.blit(text, text_rect)
    
    def update_settings(self, fps=None, rotation_speed=None, color_speed=None):
        """Update game settings in real-time"""
        if fps is not None:
            self.fps = max(10, min(120, fps))
        if rotation_speed is not None:
            self.rotation_speed = max(0.1, min(5.0, rotation_speed))
        if color_speed is not None:
            self.color_speed = max(0.1, min(3.0, color_speed))
        
        print(f"Settings updated: FPS={self.fps}, Rotation={self.rotation_speed}x, Color={self.color_speed}x")
    
    def render_frame(self):
        """Render a single frame of the torus"""
        self.screen.fill(self.BLACK)
        output = [' '] * self.screen_size
        zbuffer = [0] * self.screen_size
        
        # Generate torus points
        for theta in range(0, 628, self.theta_spacing):
            for phi in range(0, 628, self.phi_spacing):
                # Trigonometric calculations
                cosA = cos(self.A)
                sinA = sin(self.A)
                cosB = cos(self.B)
                sinB = sin(self.B)
                costheta = cos(theta)
                sintheta = sin(theta)
                cosphi = cos(phi)
                sinphi = sin(phi)
                
                # Circle coordinates before revolution
                circlex = self.R2 + self.R1 * costheta
                circley = self.R1 * sintheta
                
                # 3D coordinates after rotation
                x = circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * cosA * sinB
                y = circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * cosB
                z = self.K2 + cosA * circlex * sinphi + circley * sinA
                
                ooz = 1 / z  # one over z
                
                # 2D projection
                xp = int(self.screen_width / 2 + self.K1 * ooz * x)
                yp = int(self.screen_height / 2 - self.K1 * ooz * y)
                
                # Bounds checking
                if 0 <= xp < self.screen_width and 0 <= yp < self.screen_height:
                    position = xp + self.screen_width * yp
                    
                    # Luminance calculation
                    L = cosphi * costheta * sinB - cosA * costheta * sinphi - sinA * sintheta + cosB * (
                            cosA * sintheta - costheta * sinA * sinphi)
                    
                    if ooz > zbuffer[position]:
                        zbuffer[position] = ooz
                        luminance_index = int(L * 8)
                        output[position] = self.chars[max(0, min(len(self.chars) - 1, luminance_index))]
        
        # Display characters
        k = 0
        self.y_pixel = 0
        for i in range(self.screen_height):
            self.y_pixel += self.pixel_height
            self.x_pixel = 0
            for j in range(self.screen_width):
                self.x_pixel += self.pixel_width
                if k < len(output):
                    self.text_display(output[k], self.x_pixel, self.y_pixel)
                k += 1
        
        # Update rotation angles
        self.A += 0.15 * self.rotation_speed
        self.B += 0.035 * self.rotation_speed
        self.hue += 0.005 * self.color_speed
        
        # Keep hue in valid range
        if self.hue > 1:
            self.hue = 0
    
    def run(self):
        """Main game loop"""
        self.running = True
        print("🎮 3D Torus Game Started!")
        print("Controls: SPACE to pause, ESC to quit")
        
        while self.running:
            self.clock.tick(self.fps)
            pygame.display.set_caption(f"3D Torus - FPS: {self.clock.get_fps():.1f}")
            
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        self.running = False
                    elif event.key == pygame.K_SPACE:
                        self.paused = not self.paused
                        print("⏸️ Paused" if self.paused else "▶️ Resumed")
            
            # Render frame if not paused
            if not self.paused:
                self.render_frame()
                pygame.display.update()
        
        print("🛑 Game stopped")
        pygame.quit()
    
    def pause(self):
        """Pause the game"""
        self.paused = True
        print("⏸️ Game paused")
    
    def resume(self):
        """Resume the game"""
        self.paused = False
        print("▶️ Game resumed")
    
    def stop(self):
        """Stop the game"""
        self.running = False
        print("🛑 Stopping game...")

def main():
    """Main function to run the torus game"""
    game = TorusGame()
    
    # Handle command line arguments for web integration
    if len(sys.argv) > 1:
        try:
            settings = json.loads(sys.argv[1])
            game.update_settings(
                fps=settings.get('fps'),
                rotation_speed=settings.get('rotation_speed'),
                color_speed=settings.get('color_speed')
            )
        except json.JSONDecodeError:
            print("Invalid settings JSON, using defaults")
    
    try:
        game.run()
    except KeyboardInterrupt:
        print("\n🛑 Game interrupted by user")
    except Exception as e:
        print(f"❌ Error running game: {e}")
    finally:
        pygame.quit()

if __name__ == "__main__":
    main()
