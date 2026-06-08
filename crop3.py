from PIL import Image
original_path = r"C:\Users\ryder\.gemini\antigravity-cli\brain\db63dba7-e955-406b-a27f-53e964a28d91\arch_banner_1780923400262.png"
output_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible\img\banner.png"
im = Image.open(original_path).convert("RGB")
width, height = im.size
pixels = im.load()
def is_fg(r, g, b):
    return r > 80 or g > 80 or b > 80
min_x, max_x = width, 0
min_y, max_y = height, 0
for y in range(height):
    if sum(1 for x in range(width) if is_fg(*pixels[x, y])) > 15:
        if y < min_y: min_y = y
        if y > max_y: max_y = y
for x in range(width):
    if sum(1 for y in range(height) if is_fg(*pixels[x, y])) > 15:
        if x < min_x: min_x = x
        if x > max_x: max_x = x
if min_x < max_x and min_y < max_y:
    im.crop((min_x, min_y, max_x + 1, max_y + 1)).save(output_path, format="PNG")
    print(f"Aggressively cropped to: ({min_x}, {min_y}, {max_x}, {max_y})")
else:
    print("Crop failed.")
