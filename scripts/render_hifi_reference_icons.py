from __future__ import annotations

from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "icons" / "hifi-png"
SIZE = 256
WHITE = (255, 255, 255, 255)
SOFT = (255, 255, 255, 120)
PREVIEW_BG = (12, 16, 22, 255)


def make_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def glow(image: Image.Image, painter: Callable[[ImageDraw.ImageDraw, tuple[int, int, int, int]], None]) -> None:
    glow_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    painter(glow_draw, SOFT)
    image.alpha_composite(glow_layer.filter(ImageFilter.GaussianBlur(10)))

    line_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    line_draw = ImageDraw.Draw(line_layer)
    painter(line_draw, WHITE)
    image.alpha_composite(line_layer)


def home_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.polygon([(72, 114), (128, 72), (184, 114)], outline=color, width=10)
    draw.rectangle((84, 110, 172, 186), outline=color, width=10)
    draw.rectangle((114, 136, 142, 186), outline=color, width=10)


def browse_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    for x in (78, 132):
        for y in (78, 132):
            draw.rectangle((x, y, x + 40, y + 40), outline=color, width=10)


def recent_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((64, 64, 192, 192), outline=color, width=10)
    draw.line((128, 128, 128, 92), fill=color, width=10)
    draw.line((128, 128, 156, 146), fill=color, width=10)


def random_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.line((68, 84, 110, 84), fill=color, width=10)
    draw.line((110, 84, 146, 120), fill=color, width=10)
    draw.line((148, 82, 182, 92), fill=color, width=10)
    draw.line((182, 92, 174, 120), fill=color, width=10)
    draw.line((182, 92, 154, 68), fill=color, width=10)
    draw.line((68, 172, 112, 172), fill=color, width=10)
    draw.line((112, 172, 186, 96), fill=color, width=10)
    draw.line((148, 174, 182, 164), fill=color, width=10)
    draw.line((182, 164, 174, 136), fill=color, width=10)
    draw.line((182, 164, 154, 188), fill=color, width=10)


def glossary_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.rounded_rectangle((76, 58, 180, 194), radius=14, outline=color, width=10)
    for y, width in ((92, 72), (124, 72), (156, 48)):
        draw.line((96, y, 96 + width, y), fill=color, width=8)


def tags_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.rounded_rectangle((76, 62, 182, 194), radius=14, outline=color, width=10)
    draw.line((96, 92, 160, 92), fill=color, width=8)
    draw.line((96, 124, 160, 124), fill=color, width=8)
    draw.line((96, 156, 144, 156), fill=color, width=8)


def help_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((62, 62, 194, 194), outline=color, width=10)
    draw.ellipse((100, 100, 156, 156), outline=color, width=8)
    draw.line((128, 66, 128, 86), fill=color, width=8)
    draw.line((128, 170, 128, 190), fill=color, width=8)
    draw.line((66, 128, 86, 128), fill=color, width=8)
    draw.line((170, 128, 190, 128), fill=color, width=8)


def shoots_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((60, 60, 196, 196), outline=color, width=10)
    draw.ellipse((96, 96, 160, 160), outline=color, width=8)
    draw.line((128, 42, 128, 76), fill=color, width=8)
    draw.line((128, 180, 128, 214), fill=color, width=8)
    draw.line((42, 128, 76, 128), fill=color, width=8)
    draw.line((180, 128, 214, 128), fill=color, width=8)


def plays_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.rounded_rectangle((66, 88, 190, 166), radius=34, outline=color, width=10)
    draw.line((86, 126, 118, 126), fill=color, width=8)
    draw.line((102, 110, 102, 142), fill=color, width=8)
    draw.ellipse((142, 110, 154, 122), fill=color)
    draw.ellipse((162, 130, 174, 142), fill=color)


def codes_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.line((84, 90, 108, 118), fill=color, width=10)
    draw.line((108, 118, 84, 146), fill=color, width=10)
    draw.line((172, 90, 148, 118), fill=color, width=10)
    draw.line((148, 118, 172, 146), fill=color, width=10)
    draw.line((136, 76, 118, 180), fill=color, width=10)


def search_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((70, 70, 156, 156), outline=color, width=10)
    draw.line((148, 148, 190, 190), fill=color, width=10)


def sun_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((94, 94, 162, 162), outline=color, width=10)
    rays = [
        ((128, 48), (128, 76)),
        ((128, 180), (128, 208)),
        ((48, 128), (76, 128)),
        ((180, 128), (208, 128)),
        ((71, 71), (90, 90)),
        ((166, 166), (185, 185)),
        ((185, 71), (166, 90)),
        ((90, 166), (71, 185)),
    ]
    for start, end in rays:
        draw.line((*start, *end), fill=color, width=8)


def moon_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.arc((72, 54, 190, 190), start=58, end=302, fill=color, width=12)
    draw.arc((104, 48, 208, 184), start=102, end=258, fill=color, width=12)


def user_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((84, 58, 172, 146), outline=color, width=10)
    draw.arc((64, 126, 192, 216), start=200, end=340, fill=color, width=10)
    draw.ellipse((54, 54, 202, 202), outline=color, width=6)


def chevron_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    draw.line((94, 74, 154, 128), fill=color, width=12)
    draw.line((154, 128, 94, 182), fill=color, width=12)


def status_icon(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    points = [(52, 152), (88, 152), (104, 108), (128, 178), (150, 138), (204, 138)]
    draw.line(points, fill=color, width=10)
    draw.line((52, 188, 204, 188), fill=(255, 255, 255, 110), width=6)


ICONS: dict[str, Callable[[ImageDraw.ImageDraw, tuple[int, int, int, int]], None]] = {
    "home": home_icon,
    "browse": browse_icon,
    "recent": recent_icon,
    "random": random_icon,
    "glossary": glossary_icon,
    "tags": tags_icon,
    "help": help_icon,
    "shoots": shoots_icon,
    "plays": plays_icon,
    "codes": codes_icon,
    "search": search_icon,
    "sun": sun_icon,
    "moon": moon_icon,
    "user": user_icon,
    "chevron": chevron_icon,
    "status": status_icon,
}


def render_icon(name: str, painter: Callable[[ImageDraw.ImageDraw, tuple[int, int, int, int]], None]) -> None:
    image, _ = make_canvas()
    glow(image, painter)
    image.save(OUTPUT_DIR / f"{name}.png")


def preview_sheet() -> None:
    cols = 4
    rows = (len(ICONS) + cols - 1) // cols
    gutter = 20
    label_h = 28
    width = cols * (SIZE + gutter) + gutter
    height = rows * (SIZE + label_h + gutter) + gutter
    sheet = Image.new("RGBA", (width, height), PREVIEW_BG)
    preview_draw = ImageDraw.Draw(sheet)

    for y in range(0, height, 16):
        preview_draw.line((0, y, width, y), fill=(255, 255, 255, 10), width=1)
    for x in range(0, width, 16):
        preview_draw.line((x, 0, x, height), fill=(255, 255, 255, 10), width=1)

    for index, name in enumerate(ICONS):
        row, col = divmod(index, cols)
        icon = Image.open(OUTPUT_DIR / f"{name}.png").convert("RGBA")
        x = gutter + col * (SIZE + gutter)
        y = gutter + row * (SIZE + label_h + gutter)
        sheet.alpha_composite(icon, (x, y))
        label_draw = ImageDraw.Draw(sheet)
        label_draw.text((x + 8, y + SIZE + 4), name.upper(), fill=WHITE)

    sheet.save(OUTPUT_DIR / "_preview.png")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, painter in ICONS.items():
        render_icon(name, painter)
    preview_sheet()


if __name__ == "__main__":
    main()
