import re

filepath = 'winged_bulls.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update eyeHeight to 11.0
content = re.sub(r'this\.eyeHeight = 10\.0;', 'this.eyeHeight = 11.0;', content)
content = re.sub(r'controlManager\.eyeHeight = 10\.0;', 'controlManager.eyeHeight = 11.0;', content)

# 2. Update entrancePos y to 11
content = re.sub(r'new THREE\.Vector3\(11\.23, 10\.0, 5\.54\)', 'new THREE.Vector3(11.23, 11.0, 5.54)', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("winged_bulls.html updated for y=11 successfully!")
