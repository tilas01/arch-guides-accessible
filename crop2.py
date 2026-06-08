from PIL import Image, ImageChops
original_path = r"C:\Users\ryder\.gemini\antigravity-cli\brain\db63dba7-e955-406b-a27f-53e964a28d91\arch_banner_1780923400262.png"
output_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible\img\banner.png"
im = Image.open(original_path).convert("RGB")
bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
diff = ImageChops.difference(im, bg)
diff = diff.convert("L")
bbox = diff.point(lambda p: 255 if p > 15 else 0).getbbox()
if bbox:
    im.crop(bbox).save(output_path, format="PNG")
    print("Cropped successfully to:", bbox)
else:
    print("Could not find a bounding box.")
