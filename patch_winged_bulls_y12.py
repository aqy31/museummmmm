import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update eyeHeight to 12.0
content = re.sub(r'this\.eyeHeight = 7\.0;', 'this.eyeHeight = 12.0;', content)
content = re.sub(r'controlManager\.eyeHeight = 7\.0;', 'controlManager.eyeHeight = 12.0;', content)

# 2. Update entrancePos y to 12
content = re.sub(r'new THREE\.Vector3\(11\.23, 7\.0, 5\.54\)', 'new THREE.Vector3(11.23, 12.0, 5.54)', content)

# 3. Update the height filter to allow walls up to 15.0
content = re.sub(r'if \(maxY < 0\.0 \|\| minY > 10\.0\) continue;', 'if (maxY < 0.0 || minY > 15.0) continue;', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html updated for y=12 successfully!")
