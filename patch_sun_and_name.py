import re
import json

with open('metadata.json', 'r') as f:
    meta = json.load(f)

files = ['al_nuri_crypt.html', 'tutunji_house_iwan.html', 'winged_bulls.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Update the loading screen text to show the site name instead of NUURI 3D
    title = meta[f]['title']
    content = content.replace('<h1 class="logo-title">NUURI <span>3D</span></h1>', f'<h1 class="logo-title" style="font-size: 1.5rem;">{title}</h1>')
    content = content.replace('<span class="brand-name">NUURI</span>', f'<span class="brand-name" style="font-size: 1.2rem;">{title}</span>')

    # 2. Lock the sun EXACTLY on click
    # For btnStartTour
    content = content.replace("btnStartTour.addEventListener('click', () => {", "btnStartTour.addEventListener('click', () => {\n      window.sunLocked = true;")
    # For btnWalk
    content = content.replace("btnWalk.addEventListener('click', () => {", "btnWalk.addEventListener('click', () => {\n      window.sunLocked = true;")
    # For btnOrbit
    content = content.replace("btnOrbit.addEventListener('click', () => {", "btnOrbit.addEventListener('click', () => {\n      window.sunLocked = false;")

    # 3. Clean up the render loop just to be perfectly sure.
    # We want: if (this.dirLight && !window.sunLocked)
    content = content.replace("if (this.dirLight && !window.sunLocked && window.currentMode !== 'walk') {", "if (this.dirLight && !window.sunLocked) {")

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Applied fixes for loading text and exact sun locking!")
