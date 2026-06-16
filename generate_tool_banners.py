import os
from PIL import Image, ImageDraw, ImageFont

tools = [
    "anti-ducky",
    "anti-evil-maid",
    "kernel-watcher",
    "libre-otp",
    "scarecrow"
]

def generate_banner(dest_path, title):
    width, height = 800, 200
    radius = 30
    
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    draw.rounded_rectangle((0, 0, width, height), radius=radius, fill='#1a1b26')
    
    try:
        font_large = ImageFont.truetype("consola.ttf", 48)
        font_small = ImageFont.truetype("consola.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
        
    text_large = title
    text_small = "Author: tilas01 on GitHub"
    
    try:
        w_l = draw.textlength(text_large, font=font_large)
        w_s = draw.textlength(text_small, font=font_small)
    except:
        w_l = font_large.getsize(text_large)[0]
        w_s = font_small.getsize(text_small)[0]
        
    x_l = (width - w_l) / 2
    y_l = 60
    
    x_s = (width - w_s) / 2
    y_s = 120
    
    draw.text((x_l, y_l), text_large, font=font_large, fill='#bb9af7')
    draw.text((x_s, y_s), text_small, font=font_small, fill='#bb9af7')
    
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    img.save(dest_path)
    print(f"Saved banner to {dest_path}")

for tool in tools:
    dest = f"security-tools/{tool}/img/banner.png"
    title = tool.replace('-', '_')
    generate_banner(dest, title)
