"""
Builds public/pdf-templates/19a-package-form.pdf from the NY DMV "Driver Packet 19A" PDF
(DS-870 10/25, DS-872 10/25, DS-873 10/25, DS-875 9/16, DS-875Y 9/16).

The source packet already has fillable fields for the driver, carrier, history tables and
examiner, but not for every blank: the DS-873/875/875Y checkboxes, the signature dates,
vehicle seating/GVWR/plate, comments, scores and test dates. This adds a field over each of
those, so every blank on the printed form can be filled in, and removes the yellow
"Reset/Clear" boxes baked into the page content (they would print).

Usage (needs `pip install pymupdf`):
    python scripts/build-19a-template.py "<Driver Packet 19A.pdf>" public/pdf-templates/19a-package-form.pdf
"""
import sys

import pymupdf

# Checkbox glyph cells (Wingdings characters) as positioned in the source; the field goes over
# the square actually drawn inside each cell, measured from the rendered page.
GLYPH_CHECKBOXES = {
    3: {  # DS-873 defensive driving observation
        "873-INSIDE": (235.2, 345.5, 245.9, 358.8),
        "873-OUTSIDE": (275.9, 345.5, 286.6, 358.8),
        **{f"873-{n}-SATISFACTORY": (234.0, y, 244.7, y + 13.3) for n, y in zip(range(1, 6), (371.8, 387.1, 402.6, 418.0, 433.4))},
        **{f"873-{n}-NEEDS-IMPROVEMENT": (274.2, y, 284.8, y + 13.3) for n, y in zip(range(1, 6), (371.8, 387.1, 402.6, 418.0, 433.4))},
        "873-6-SATISFACTORY": (234.4, 448.8, 245.1, 462.1),
        "873-6-NEEDS-IMPROVEMENT": (274.0, 448.8, 284.7, 462.1),
        **{f"873-{n}-SATISFACTORY": (529.5, y, 540.2, y + 13.3) for n, y in zip(range(7, 11), (371.8, 387.1, 402.6, 418.0))},
        **{f"873-{n}-NEEDS-IMPROVEMENT": (570.2, y, 580.8, y + 13.3) for n, y in zip(range(7, 11), (371.8, 387.1, 402.6, 418.0))},
        "873-11-NOT-APPLICABLE": (503.4, 448.8, 514.1, 462.1),
        "873-11-SATISFACTORY": (529.5, 448.8, 540.2, 462.1),
        "873-11-NEEDS-IMPROVEMENT": (570.8, 448.8, 581.5, 462.1),
    },
    4: {  # DS-875 results
        "875-QUALIFIED": (24.4, 593.0, 36.0, 607.5),
        "875-DISQUALIFIED": (91.3, 593.0, 102.9, 607.5),
        "875-DQ-40-OR-MORE-POINTS": (103.8, 616.0, 113.6, 628.2),
        "875-DQ-DISQUALIFICATION-ITEM": (225.7, 616.0, 235.5, 628.2),
        "875-DQ-TWO-10-POINT-ITEMS": (437.5, 616.0, 447.3, 628.2),
    },
    5: {  # DS-875Y
        "875Y-ORAL": (222.0, 164.4, 234.5, 180.0),
        "875Y-WRITTEN": (270.0, 164.4, 282.5, 180.0),
        "875Y-RE-EXAMINATION": (328.1, 164.4, 340.5, 180.0),
        "875Y-PASSED": (309.2, 446.1, 321.6, 461.6),
        "875Y-FAILED": (309.1, 468.5, 321.7, 484.1),
    },
}

# DS-875 road-test items are squares drawn as vector art: (section, x0, top y of each item's square).
ROAD_TEST_COLUMNS = [
    ("PRE-TRIP", 36.1, "ABCDEFGHIJKL", (259.1, 269.9, 279.7, 291.1, 303.3, 322.8, 333.0, 345.0, 356.0, 366.2, 377.1, 388.6)),
    ("DEPARTING", 36.1, "ABC", (412.4, 424.0, 434.4)),
    ("EN-ROUTE", 36.1, "ABCDEFGHI", (458.1, 468.9, 480.7, 501.1, 523.8, 536.6, 547.3, 558.4, 569.2)),
    ("EN-ROUTE", 318.7, "JKLMNOPQRS", (259.1, 269.9, 279.7, 291.1, 303.3, 314.4, 324.8, 336.0, 347.6, 357.9)),
    ("PARKING", 320.7, "ABCDEF", (382.7, 402.2, 412.8, 424.0, 434.8, 445.7)),
    ("PASSENGERS", 320.7, "ABCD", (481.3, 503.0, 524.0, 557.9)),
]
SQUARE = 7.1

# (name, rect, font size, multiline): blanks that need typed text.
TEXT_FIELDS = {
    1: [  # DS-870
        ("870-DRIVER-SIGNATURE-DATE", (496, 638, 592, 651), 10, False),
        ("870-EMPLOYER-SIGNATURE-DATE", (496, 721, 592, 733), 10, False),
        ("870-DATE-OF-ABSTRACTS", (498, 741, 592, 752), 10, False),
    ],
    2: [  # DS-872
        ("872-ABSTRACTS-DATED", (106, 646, 157, 658), 8, False),
        ("872-DRIVER-SIGNATURE-DATE", (478, 587, 592, 600), 10, False),
        ("872-DATE-OF-INTERVIEW", (457, 724, 592, 737), 10, False),
    ],
    3: [  # DS-873
        ("873-ADULT-SEATING-CAPACITY", (240, 302, 316, 316.5), 10, False),
        ("873-GVWR", (318, 302, 425, 316.5), 10, False),
        ("873-VEHICLE-PLATE", (427, 302, 562, 316.5), 10, False),
        ("873-COMMENTS", (21, 476, 591, 525), 10, True),
        ("873-DRIVER-SIGNATURE-DATE", (462, 574, 592, 587), 10, False),
        ("873-DATE-OF-OBSERVATION", (463, 744, 593, 758.5), 10, False),
    ],
    4: [  # DS-875
        ("875-ADULT-SEATING-CAPACITY", (214, 229, 301, 240.5), 10, False),
        ("875-GVWR", (304, 229, 387, 240.5), 10, False),
        ("875-VEHICLE-PLATE", (390, 229, 532, 240.5), 10, False),
        ("875-EN-ROUTE-D-SIGNALS", (216, 500, 243, 510), 7, False),
        ("875-EN-ROUTE-D-OBSERVES", (91.5, 509, 118.5, 519), 7, False),
        ("875-EN-ROUTE-D-PROCEDURE", (165.5, 509, 192.5, 519), 7, False),
        ("875-DATE-OF-TEST", (463, 748, 592, 762.5), 10, False),
    ],
    5: [  # DS-875Y
        ("875Y-SECTION-A-CORRECT", (72, 458, 109, 490), 14, False),
        ("875Y-SECTION-B-CORRECT", (172, 458, 212, 490), 14, False),
        ("875Y-DATE-OF-EXAMINATION", (452, 683, 575, 697), 10, False),
    ],
}


def drawn_square(page, cell):
    """The square actually drawn inside a glyph cell, from the dark pixels of a high-res render."""
    dpi = 576
    pix = page.get_pixmap(clip=cell, dpi=dpi, colorspace=pymupdf.csGRAY, annots=False)
    xs, ys = [], []
    for y in range(pix.height):
        row = pix.samples[y * pix.stride : y * pix.stride + pix.width]
        for x, value in enumerate(row):
            if value < 128:
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit(f"no checkbox drawn in {cell} on page {page.number + 1}")
    k = 72 / dpi
    return pymupdf.Rect(cell.x0 + min(xs) * k, cell.y0 + min(ys) * k, cell.x0 + (max(xs) + 1) * k, cell.y0 + (max(ys) + 1) * k)


def add_checkbox(page, name, rect):
    w = pymupdf.Widget()
    w.field_type = pymupdf.PDF_WIDGET_TYPE_CHECKBOX
    w.field_name = name
    w.rect = pymupdf.Rect(rect) + (-0.4, -0.4, 0.4, 0.4)
    w.border_width = 0
    w.field_value = False
    page.add_widget(w)


def add_text(page, name, rect, size, multiline):
    w = pymupdf.Widget()
    w.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
    w.field_name = name
    w.rect = pymupdf.Rect(rect)
    w.text_font = "Helv"
    w.text_fontsize = size
    w.border_width = 0
    if multiline:
        w.field_flags |= pymupdf.PDF_TX_FIELD_IS_MULTILINE
    widget = page.add_widget(w)
    if name.endswith("-CORRECT"):
        # Scores sit right next to the printed "/15" and "/5".
        page.parent.xref_set_key(widget.xref, "Q", "2")


def remove_reset_boxes(page):
    """The yellow "Reset/Clear" buttons were flattened into the page content; white them out."""
    hits = page.search_for("Reset/Clear") + page.search_for("reset/clear")
    if not hits:
        return 0
    for text in hits:
        # Only the box drawn around the label: nearby text (e.g. "Become an Organ Donor!") must stay.
        area = pymupdf.Rect(text)
        for d in page.get_drawings():
            if d["rect"].contains(text) and d["rect"].width < 200:
                area |= d["rect"]
        # No margin: on DS-870 the box sits 0.6 pt under the organ-donor line.
        page.add_redact_annot(area, fill=(1, 1, 1))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED)
    return len(hits)


def main(src, dst):
    doc = pymupdf.open(src)
    added = 0
    for pno, page in enumerate(doc, start=1):
        remove_reset_boxes(page)
        for name, cell in GLYPH_CHECKBOXES.get(pno, {}).items():
            add_checkbox(page, name, drawn_square(page, pymupdf.Rect(cell)))
            added += 1
        if pno == 4:
            for section, x0, letters, tops in ROAD_TEST_COLUMNS:
                for letter, y0 in zip(letters, tops):
                    add_checkbox(page, f"875-{section}-{letter}", (x0, y0, x0 + SQUARE, y0 + SQUARE))
                    added += 1
        for name, rect, size, multiline in TEXT_FIELDS.get(pno, []):
            add_text(page, name, rect, size, multiline)
            added += 1
    doc.save(dst, garbage=3, deflate=True)
    print(f"added {added} fields -> {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
