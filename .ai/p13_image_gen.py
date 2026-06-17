from PIL import Image, ImageDraw, ImageFont
import glob
import os

def make_rounded_icon(icon_path):
    try:
        img = Image.open(icon_path).convert("RGBA")
        
        # Create a rounded mask
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        # Circular mask (ellipse bounding box same as img size)
        draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
        
        # Apply mask
        img.putalpha(mask)
        img.save(icon_path, "PNG")
        print(f"Rounded {icon_path}")
    except Exception as e:
        print(f"Failed to round {icon_path}: {e}")

def create_banner(banner_path, title):
    try:
        width, height = 800, 200
        img = Image.new('RGB', (width, height), color='#1a1b26')
        draw = ImageDraw.Draw(img)
        
        try:
            # Try to load a nice Windows monospace font
            font = ImageFont.truetype("consola.ttf", 60)
        except:
            font = ImageFont.load_default()
        
        # Calculate text bounding box
        bbox = draw.textbbox((0,0), title, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        
        x = (width - text_w) / 2
        y = (height - text_h) / 2
        
        # Draw some subtle accents to match "Libre-OTP style"
        draw.rectangle([0, 0, width, 5], fill='#7aa2f7')
        draw.rectangle([0, height-5, width, height], fill='#bb9af7')
        
        draw.text((x, y), title, font=font, fill='#7dcfff')
        
        img.save(banner_path)
        print(f"Created banner {banner_path}")
    except Exception as e:
        print(f"Failed to create banner {banner_path}: {e}")

names = {
    'anti-ducky': 'Input Guard (Anti-Ducky)',
    'anti-evil-maid': 'Anti-Evil Maid',
    'kernel-watcher': 'Kernel Watcher (EDR)',
    'scarecrow': 'ScareCrow (LKM)',
    'libre-otp': 'Post-Quantum Libre-OTP'
}

for tool, name in names.items():
    icon_path = os.path.join('security-tools', tool, 'img', 'icon.png')
    banner_path = os.path.join('security-tools', tool, 'img', 'banner.png')
    
    if os.path.exists(icon_path):
        make_rounded_icon(icon_path)
    else:
        print(f"Icon not found: {icon_path}")
        
    create_banner(banner_path, name)

