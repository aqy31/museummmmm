import re

files = ['al_nuri_crypt.html', 'tutunji_house_iwan.html', 'winged_bulls.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove app-brand
    content = re.sub(r'<div class="app-brand">.*?</div>', '', content, flags=re.DOTALL)
    
    # Remove mode-badge
    content = re.sub(r'<div class="mode-badge">.*?</div>', '', content, flags=re.DOTALL)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Removed app-brand and mode-badge!")
