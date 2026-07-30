import re
import os

files = ['al_nuri_crypt.html', 'tutunji_house_iwan.html', 'winged_bulls.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Update setMode(mode) to set window.currentMode
    content = content.replace("setMode(mode) {\n        this.mode = mode;", "setMode(mode) {\n        this.mode = mode;\n        window.currentMode = mode;")
    
    # 2. Update render() to fix the sun in walk mode
    # Currently it is: if (this.dirLight && !window.sunLocked)
    content = content.replace("if (this.dirLight && !window.sunLocked) {", "if (this.dirLight && !window.sunLocked && window.currentMode !== 'walk') {")
    
    # 3. Strip out the enter/exit walk performance definitions and calls completely just to be safe
    # We will use simple replace for the calls since regex is brittle.
    content = content.replace("sceneManager.renderer.shadowMap.autoUpdate = false;", "")
    content = content.replace("sceneManager.renderer.shadowMap.autoUpdate = true;", "")
    content = content.replace("sceneManager.renderer.shadowMap.needsUpdate = true;", "")
    content = content.replace("sceneManager.enterWalkPerformance();", "")
    content = content.replace("sceneManager.exitWalkPerformance();", "")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Applied sun rotation fix for walk mode!")
