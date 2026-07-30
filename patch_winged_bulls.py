import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update eyeHeight definition in class
content = re.sub(r'this\.eyeHeight = 1\.85;', 'this.eyeHeight = 5.0;', content)

# 2. Update eyeHeight in setup
content = re.sub(r'controlManager\.eyeHeight = 1\.85;', 'controlManager.eyeHeight = 5.0;', content)

# 3. Update waistY in applyCollisionAndMove
content = re.sub(r'const waistY = this\.camera\.position\.y - 0\.9;', 'const waistY = this.camera.position.y - 2.5;', content)

# 4. Update the triangle filter in setColliders
content = re.sub(r'if \(maxY < 0\.1 \|\| minY > 2\.4\) continue;', 'if (maxY < 1.0 || minY > 6.0) continue;', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html updated successfully!")
