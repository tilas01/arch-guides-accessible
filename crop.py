from PIL import Image
original_path = r"C:\Users\ryder\.gemini\antigravity-cli\brain\db63dba7-e955-406b-a27f-53e964a28d91\arch_banner_1780923400262.png"
output_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible\img\banner.png"
im = Image.open(original_path).convert("RGB")
pixels = im.load()
width, height = im.size
min_x, min_y, max_x, max_y = width, height, 0, 0
bg_r, bg_g, bg_b = pixels[0, 0]
def is_foreground(r, g, b):
    return abs(r - bg_r) > 20 or abs(g - bg_g) > 20 or abs(b - bg_b) > 20
for y in range(height):
    for x in range(width):
        r, g, b = pixels[x, y]
        if is_foreground(r, g, b):
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y
if min_x < max_x and min_y < max_y:
    im.crop((min_x, min_y, max_x + 1, max_y + 1)).save(output_path)
    print("Cropped successfully!")
else:
    print("Failed to crop.")
