# Builds public/fonts/op-symbols.woff2: → ★ ≈ from DejaVu Sans Bold, advances matched to the Figma render.
# Barlow/Bebas lack these glyphs; without this each OS draws its own fallback at a different width.
# Targets (em): → 1.02 (Figma "…  →" text widths), ★ 0.96 (5 stars = 78px @16px), ≈ 0.49 ("≈ 50 MILES" = 75px @14px).
# Needs: pip install fonttools brotli ; DejaVu Sans Bold at the path below.
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
src = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
opts = subset.Options(); opts.layout_features = []; opts.name_IDs = ['*']; opts.notdef_outline = True
f = TTFont(src); s = subset.Subsetter(opts); s.populate(unicodes=[0x2192, 0x2605, 0x2248]); s.subset(f)
upm = f['head'].unitsPerEm; cmap = f.getBestCmap(); gs = f.getGlyphSet(); glyf = f['glyf']; hmtx = f['hmtx']
targets = {0x2192: (1.02, 1.0), 0x2605: (0.96, 1.0), 0x2248: (0.49, None)}
for u, (adv, sx) in targets.items():
    g = cmap[u]; newAdv = round(adv * upm); glyph = glyf[g]; glyph.recalcBounds(glyf)
    w = glyph.xMax - glyph.xMin
    scale = sx if sx else min(1.0, (newAdv * 0.86) / w)
    dx = (newAdv - w * scale) / 2 - glyph.xMin * scale
    pen = TTGlyphPen(gs); gs[g].draw(TransformPen(pen, (scale, 0, 0, 1, dx, 0)))
    glyf[g] = pen.glyph(); glyf[g].recalcBounds(glyf); hmtx[g] = (newAdv, glyf[g].xMin)
f['name'].setName('Op Symbols', 1, 3, 1, 0x409); f['name'].setName('Op Symbols', 4, 3, 1, 0x409)
f.flavor = 'woff2'; f.save('public/fonts/op-symbols.woff2')
print('ok')
