from PIL import Image, ImageDraw
original_path = r"C:\Users\ryder\.gemini\antigravity-cli\brain\db63dba7-e955-406b-a27f-53e964a28d91\arch_banner_1780923400262.png"
output_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible\img\banner.png"

im = Image.open(original_path).convert("RGBA")
# More aggressive crop to remove the final padding at the top and ensure symmetry
bbox = (80, 290, 909, 660)
cropped = im.crop(bbox)

radius = 25
mask = Image.new("L", cropped.size, 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle((0, 0, cropped.size[0], cropped.size[1]), radius=radius, fill=255)
cropped.putalpha(mask)
cropped.save(output_path, "PNG")
print("Banner precisely cropped and cornered losslessly.")
