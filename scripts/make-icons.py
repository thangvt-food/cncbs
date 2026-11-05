#!/usr/bin/env python3
"""Vẽ icon ứng dụng cho manifest PWA từ chính hình cuốn sách của favicon.svg.

Chạy một lần khi cần đổi icon: python3 scripts/make-icons.py
Icon thường dùng góc bo 14/64 theo tiết tấu của bộ token; bản maskable để vuông
toàn phần và thu biểu tượng vào vùng an toàn 80% vì launcher Android tự cắt.
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'public' / 'icons'
TEAL = (44, 107, 102, 255)
PAGE = (236, 234, 228, 255)
PAGE_BACK = (236, 234, 228, 199)
UNITS = 64.0


def book(draw, size, dx=0.0, dy=0.0, scale=1.0):
    u = size / UNITS * scale

    def rect(x0, y0, x1, y1):
        return (dx + x0 * u, dy + y0 * u, dx + x1 * u, dy + y1 * u)

    r = 5 * u
    draw.rounded_rectangle(rect(14, 21, 34, 45), radius=r, fill=PAGE)
    draw.rounded_rectangle(rect(30, 21, 50, 45), radius=r, fill=PAGE_BACK)
    draw.line(rect(32, 27, 32, 44), fill=TEAL, width=max(1, round(2.5 * u)))


def make(name, size, *, maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if maskable:
        draw.rectangle((0, 0, size, size), fill=TEAL)
        scale = 0.62
        book(draw, size, dx=size * (1 - scale) / 2, dy=size * (1 - scale) / 2, scale=scale)
    else:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=size * 14 / UNITS, fill=TEAL)
        book(draw, size)
    img.save(OUT / name)
    return name


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    specs = [
        ('icon-192.png', 192, False),
        ('icon-512.png', 512, False),
        ('maskable-512.png', 512, True),
        # iOS tự bo góc nên bản apple-touch phải lấp đầy nền, không được trong suốt.
        ('apple-touch-icon.png', 180, True),
    ]
    for name, size, maskable in specs:
        make(name, size, maskable=maskable)
        print(' wrote public/icons/' + name)
