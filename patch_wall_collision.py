import re

filepath = 'tutunji_house_iwan.html'

with open(filepath, 'r', encoding='utf-8') as file:
    content = file.read()

# 1. Update waistY and playerRadius
old_collision = """        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 0.55;
          const waistY = this.camera.position.y - 0.9;"""

new_collision = """        if (this.wallMesh && moveDist > 0.001) {
          const playerRadius = 2.0; // Increased radius for giant model
          const waistY = this.camera.position.y - (this.eyeHeight / 2.0); // Dynamic waist height"""

if old_collision in content:
    content = content.replace(old_collision, new_collision)
else:
    print("WARNING: Could not find old collision block to replace!")

with open(filepath, 'w', encoding='utf-8') as file:
    file.write(content)

print("Patched wall collision (playerRadius=2.0 and dynamic waistY)!")
