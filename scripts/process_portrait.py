#!/usr/bin/env python3
"""
Portrait processing for Minimal Zine Poster homepage.

Extracts the person from the background using rembg (AI background removal),
then adds a thick white border/stroke around the person's silhouette.

Usage:
    python3 scripts/process_portrait.py

Input:  images/York_Wang.jpg
Output: images/York_Wang_cutout.png
"""

from PIL import Image, ImageFilter
from rembg import remove
import os
import sys


def process_portrait(
    input_path: str,
    output_path: str,
    border_width: int = 22,
    max_width: int = 900,
):
    """
    Extract person from background, add thick white border around silhouette.

    Args:
        input_path: Path to original portrait image
        output_path: Path for processed PNG output
        border_width: Thickness of white border in pixels (at output resolution)
        max_width: Maximum width of output image in pixels
    """
    print(f"Loading: {input_path}")
    img = Image.open(input_path)
    print(f"  Original size: {img.size}")

    # Scale factor for border — apply at high resolution then resize
    # This ensures the border looks smooth
    scale = max_width / img.width
    border_px = int(border_width / scale)

    # Step 1: Remove background with rembg
    print("  Removing background with rembg...")
    cutout = remove(img)  # Returns RGBA with transparent background
    print(f"  Cutout size: {cutout.size}")

    # Step 2: Get alpha channel
    alpha = cutout.split()[-1]

    # Step 3: Dilate the alpha mask to create border silhouette
    # MaxFilter expands the white (opaque) region
    print(f"  Adding {border_px}px white border...")
    filter_size = border_px * 2 + 1
    dilated_alpha = alpha.filter(ImageFilter.MaxFilter(filter_size))

    # Step 4: Create white silhouette from dilated alpha
    white_bg = Image.new("RGBA", cutout.size, (255, 255, 255, 255))
    white_silhouette = Image.new("RGBA", cutout.size, (0, 0, 0, 0))
    white_silhouette.paste(white_bg, mask=dilated_alpha)

    # Step 5: Composite — white silhouette behind original cutout
    result = Image.alpha_composite(white_silhouette, cutout)

    # Step 6: Resize for web
    w, h = result.size
    if w > max_width:
        ratio = max_width / w
        new_size = (max_width, int(h * ratio))
        result = result.resize(new_size, Image.LANCZOS)
        print(f"  Resized to: {new_size}")

    # Step 7: Save
    result.save(output_path, "PNG")
    print(f"Saved: {output_path}")
    print("Done!")


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(repo_root, "images", "York_Wang.jpg")
    output_path = os.path.join(repo_root, "images", "York_Wang_cutout.png")

    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    process_portrait(input_path, output_path)


if __name__ == "__main__":
    main()
