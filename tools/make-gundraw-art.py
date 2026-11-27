# GunDraw v0.7 웹 그림 -> 사이트 webp(크롭·회색 배경을 어두운 카드 배경으로 교체). 원본: gamehub projects/gundraw/assets/v07 (web/·final/)
# 사용: python -I tools/make-gundraw-art.py <v07 폴더> assets/games/gundraw/art  (og-1200x630.jpg는 assets/games/gundraw/로 옮김)
import sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
W = lambda p: os.path.join(src, p)
def save(im, name, w, h=None, q=80):
    h = h or round(im.height * w / im.width)
    im.convert('RGB').resize((w, h), Image.LANCZOS).save(os.path.join(out, name), 'WEBP', quality=q, method=6)
def dark_bg(size):
    w, h = size; bg = Image.new('RGB', size)
    top, bot = (16, 26, 38), (9, 14, 22)
    px = bg.load()
    for y in range(h):
        t = y / (h - 1); c = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        for x in range(w): px[x, y] = c
    glow = Image.new('L', size, 0); d = ImageDraw.Draw(glow)
    d.ellipse((w * .05, h * .08, w * .95, h * .92), fill=120); glow = glow.filter(ImageFilter.GaussianBlur(w * .18))
    teal = Image.new('RGB', size, (40, 92, 112))
    return Image.composite(teal, bg, glow)
def rekey(path):
    im = Image.open(path).convert('RGB'); w, h = im.size
    bgc = im.getpixel((4, 4))
    diff = ImageChops.difference(im, Image.new('RGB', im.size, bgc)).convert('L')  # ~mean diff
    mark = im.copy()
    for p in [(0, 0), (w - 1, 0), (0, h // 2), (w - 1, h // 2), (0, h - 1), (w - 1, h - 1), (w // 2, 0)]:
        ImageDraw.floodfill(mark, p, (255, 0, 255), thresh=26)
    m = Image.eval(ImageChops.difference(mark, Image.new('RGB', im.size, (255, 0, 255))).convert('L'), lambda v: 255 if v < 2 else 0)
    near = Image.eval(diff, lambda v: 255 if v < 5 else 0)
    hole = near.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
    m = ImageChops.lighter(m, hole)
    ring = m.filter(ImageFilter.MaxFilter(7))
    soft = Image.eval(diff, lambda v: min(255, max(0, (v - 8) * 7)))
    alpha = Image.new('L', im.size, 255)
    alpha.paste(soft, mask=ring)          # edge ring: soft alpha by distance
    alpha.paste(0, mask=m)                # bg: 0
    alpha = alpha.filter(ImageFilter.GaussianBlur(.6))
    return Image.composite(im, dark_bg(im.size), alpha)
def crop34(im, top=0.04):
    w, h = im.size; th = round(w * 4 / 3)
    if th <= h:
        y = min(round(h * top), h - th); return im.crop((0, y, w, y + th))
    tw = round(h * 3 / 4); x = (w - tw) // 2; return im.crop((x, 0, x + tw, h))
hero = Image.open(W('web/hero-1600x2000.png'))
for w in (1000, 640): save(hero, f'hero-{w}.webp', w)
sq = Image.open(W('web/hero-1024x1024.png'))
for w in (768, 480): save(sq, f'hero-sq-{w}.webp', w)
ban = Image.open(W('web/banner-1920x1080.png'))
for w in (1280, 960, 480): save(ban, f'card-{w}.webp', w)
st = Image.open(W('web/story-1536x1024.png'))
for w in (1024, 768, 480): save(st, f'story-{w}.webp', w)
def flat_bg(im):
    # 테두리가 한 가지 색(단색 배경)이면 True -> 어두운 카드 배경으로 다시 깜. 복도 배경 파일은 그대로 씀
    im = im.convert('RGB'); w, h = im.size
    pts = [im.getpixel((x, y)) for x in range(0, w, 37) for y in (2, h - 3)] + [im.getpixel((x, y)) for y in range(0, h, 37) for x in (2, w - 3)]
    c0 = pts[0]; return sum(max(abs(p[i] - c0[i]) for i in range(3)) < 12 for p in pts) / len(pts) > .85
def card(path):
    im = Image.open(path); return rekey(path) if flat_bg(im) else im
for k in ('somi', 'daon', 'bori', 'ari'):
    im = card(W(f'web/char-{k}-1200x1600.png'))
    for w in (900, 450): save(im, f'cast-{k}-{w}.webp', w, round(w * 4 / 3))
# 컨셉아트(캐릭터별 3컷, art-slots-v5): web/concept/<id>-<a|b|c>-1200x1600.png -> concept-<id>-<1|2|3>-*.webp (b는 일상복). *-pre.png는 쓰지 않음
for k in ('somi', 'daon', 'bori', 'ari'):
    for n, v in ((1, 'a'), (2, 'b'), (3, 'c')):
        f = W(f'web/concept/{k}-{v}-1200x1600.png')
        if not os.path.exists(f): continue
        im = crop34(Image.open(f))
        for w in (900, 450): save(im, f'concept-{k}-{n}-{w}.webp', w, round(w * 4 / 3))
Image.open(W('web/share-1200x630.png')).convert('RGB').save(os.path.join(out, 'og-1200x630.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)
for f in sorted(os.listdir(out)): print(f, os.path.getsize(os.path.join(out, f)) // 1024, 'KB')
