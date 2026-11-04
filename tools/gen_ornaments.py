#!/usr/bin/env python3
"""Genera la ornamentación floral en relieve (blanco sobre blanco) del sobre.
Salida: assets/img/orn-top.svg, orn-side.svg, orn-bottom.svg   —   uso: python3 tools/gen_ornaments.py"""
import math, random

random.seed(7)
DEFS = '''<defs>
<linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e8ebf5"/></linearGradient>
<filter id="emb" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="b"/>
<feOffset in="b" dx="1.4" dy="1.7" result="o1"/><feFlood flood-color="#6a77a3" flood-opacity=".55"/><feComposite in2="o1" operator="in" result="sh"/>
<feOffset in="b" dx="-1" dy="-1.2" result="o2"/><feFlood flood-color="#ffffff" flood-opacity="1"/><feComposite in2="o2" operator="in" result="hl"/>
<feMerge><feMergeNode in="sh"/><feMergeNode in="hl"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'''
STROKE = '#bfc7de'
VEIN = '#d3d9ea'


def f(x):
    return f"{x:.1f}"


def leaf(x, y, ang, L, W):
    d = f"M0,0 C{f(L*.28)},{f(-W)} {f(L*.72)},{f(-W*.9)} {f(L)},0 C{f(L*.72)},{f(W*.9)} {f(L*.28)},{f(W)} 0,0Z"
    veins = f"M0,0 L{f(L*.92)},0"
    for k in (.3, .52, .74):
        veins += f" M{f(L*k)},0 L{f(L*(k+.16))},{f(-W*.55)} M{f(L*k)},0 L{f(L*(k+.16))},{f(W*.55)}"
    return (f'<g transform="translate({f(x)},{f(y)}) rotate({f(ang)})"><path d="{d}"/>'
            f'<path d="{veins}" fill="none" stroke="{VEIN}" stroke-width=".6"/></g>')


def petal(L, W):
    return f"M0,0 C{f(L*.2)},{f(-W)} {f(L*.85)},{f(-W*1.05)} {f(L)},0 C{f(L*.85)},{f(W*1.05)} {f(L*.2)},{f(W)} 0,0Z"


def flower(x, y, R, rot=0, rings=4):
    spec = [(9, 1.0, .40, 0), (8, .80, .36, .5), (7, .58, .31, 0), (6, .36, .26, .5)][:rings]
    out = [f'<g transform="translate({f(x)},{f(y)}) rotate({f(rot)})">']
    for n, lf, wf, off in spec:
        L, W = R * lf, R * wf
        for i in range(n):
            a = (i + off) * 360 / n
            out.append(f'<path d="{petal(L, W)}" transform="rotate({f(a)})"/>')
            if lf >= .8:
                out.append(f'<path d="M{f(L*.12)},0 L{f(L*.78)},0" transform="rotate({f(a)})" fill="none" stroke="{VEIN}" stroke-width=".6"/>')
    out.append(f'<circle r="{f(R*.1)}"/>')
    for i in range(10):
        a = math.radians(i * 36)
        out.append(f'<circle cx="{f(math.cos(a)*R*.19)}" cy="{f(math.sin(a)*R*.19)}" r="{f(max(R*.025, .8))}"/>')
    out.append('</g>')
    return ''.join(out)


def bez(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    x = u**3*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3
    y = u**3*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3
    dx = 3*u*u*(x1-x0) + 6*u*t*(x2-x1) + 3*t*t*(x3-x2)
    dy = 3*u*u*(y1-y0) + 6*u*t*(y2-y1) + 3*t*t*(y3-y2)
    return x, y, math.degrees(math.atan2(dy, dx))


def branch(p, n, L, W, flip=1):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    out = [f'<path d="M{x0},{y0} C{x1},{y1} {x2},{y2} {x3},{y3}" fill="none" stroke="{STROKE}" stroke-width="1.6" stroke-linecap="round"/>']
    for i in range(n):
        t = (i + 1) / (n + 1)
        x, y, a = bez(p, t)
        s = 1 - .45 * t
        side = flip if i % 2 == 0 else -flip
        out.append(leaf(x, y, a + side * 42, L * s, W * s))
    x, y, a = bez(p, 1)
    out.append(leaf(x, y, a, L * .6, W * .6))
    return ''.join(out)


def berries(pts, r=2.4):
    return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y in pts)


def mirror(g, w):
    return f'<g>{g}</g><g transform="translate({w},0) scale(-1,1)">{g}</g>'


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{DEFS}'
            f'<g fill="url(#pg)" stroke="{STROKE}" stroke-width=".8" filter="url(#emb)">{body}</g></svg>')


def top():
    half = (branch(((190, 150), (140, 178), (80, 160), (24, 118)), 7, 34, 11)
            + branch(((190, 162), (150, 208), (95, 218), (46, 200)), 6, 30, 10, -1)
            + branch(((192, 122), (150, 72), (100, 52), (50, 62)), 6, 30, 10)
            + flower(128, 124, 31, 10) + flower(84, 178, 20, 20) + flower(58, 82, 12, 0, 2)
            + berries([(30, 150), (16, 96), (110, 214), (150, 40)]))
    mid = (leaf(200, 62, -62, 44, 13) + leaf(200, 62, -118, 44, 13) + flower(200, 108, 54, 0))
    return svg(400, 250, mirror(half, 400) + mid)


def bottom():
    half = (branch(((218, 196), (150, 268), (80, 262), (18, 214)), 8, 38, 12, -1)
            + branch(((212, 128), (152, 66), (92, 56), (28, 92)), 8, 36, 12)
            + branch(((226, 92), (212, 52), (180, 26), (138, 18)), 5, 28, 9)
            + flower(150, 168, 44, 8) + flower(98, 206, 28, 16) + flower(76, 112, 22, 0, 3) + flower(150, 70, 14, 0, 2)
            + berries([(40, 150), (24, 60), (190, 20), (120, 250)]))
    mid = leaf(230, 88, -60, 50, 15) + leaf(230, 88, -120, 50, 15) + flower(230, 152, 70, 0)
    return svg(460, 300, mirror(half, 460) + mid)


def side():
    p = ((72, 6), (-6, 170), (126, 340), (50, 514))
    body = branch(p, 15, 38, 13)
    for t, dx, R in ((.1, 24, 15), (.28, -26, 19), (.5, 26, 17), (.7, -24, 19), (.9, 22, 14)):
        x, y, _ = bez(p, t)
        body += flower(x + dx, y, R, t * 90, 3)
    body += berries([(104, 70), (12, 170), (100, 250), (16, 360), (96, 440), (20, 480)], 2.4)
    return svg(120, 520, body)


for name, art in (('top', top()), ('bottom', bottom()), ('side', side())):
    open(f'assets/img/orn-{name}.svg', 'w').write(art)
print('ok')
