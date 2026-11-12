"""Subset a variable woff2 to the Latin characters this site needs and trim the weight axis."""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.subset import Subsetter, Options

src, dst, wmin, wmax = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
font = TTFont(src)
axis = next(a for a in font["fvar"].axes if a.axisTag == "wght")
wmin, wmax = max(wmin, axis.minValue), min(wmax, axis.maxValue)

# Basic Latin + Latin-1 Supplement + the typographic punctuation and symbols used in UK English copy.
unicodes = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [
    0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026,
    0x2032, 0x2033, 0x20AC, 0x2122, 0x2190, 0x2192, 0x2212, 0x00D7, 0x2009, 0x200A, 0x202F,
]
opts = Options()
opts.flavor = "woff2"
opts.layout_features = ["kern", "liga", "ccmp", "calt", "tnum", "pnum", "mark", "mkmk", "rvrn"]
opts.name_IDs = [1, 2, 3, 4, 6]
opts.notdef_outline = True
opts.hinting = False
opts.desubroutinize = True
sub = Subsetter(opts)
sub.populate(unicodes=unicodes)
sub.subset(font)
if (wmin, wmax) != (axis.minValue, axis.maxValue):
    font = instancer.instantiateVariableFont(font, {"wght": (wmin, wmax)})
font.flavor = "woff2"
font.save(dst)
print(f"{os.path.basename(dst)}: {os.path.getsize(dst)/1024:.1f} KB, wght {wmin:.0f}-{wmax:.0f}, glyphs {len(font.getGlyphOrder())}")
