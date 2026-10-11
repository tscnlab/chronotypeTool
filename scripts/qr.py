"""Generate the two functional QR codes, including a four-module quiet zone."""
import pathlib
import subprocess
import sys
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

output = pathlib.Path(sys.argv[1])
output.mkdir(parents=True, exist_ok=True)
for language in ("en", "de"):
    value = f"https://tscnlab.github.io/chronotypeTool/?lang={language}"
    qr = QrCodeWidget(value, barLevel="Q", barBorder=4)
    qr.qr.make()
    side = (qr.qr.getModuleCount() + 8) * 12
    qr.barWidth = qr.barHeight = side
    drawing = Drawing(side, side)
    drawing.add(qr)
    stem = output / f"qr-{language}"
    renderPDF.drawToFile(drawing, str(stem) + ".pdf")
    subprocess.run(["pdftoppm", "-singlefile", "-r", "72", "-png", str(stem) + ".pdf", str(stem)], check=True)

