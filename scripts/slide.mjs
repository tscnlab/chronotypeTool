// Rebuild the invitation exports. Requires @oai/artifact-tool 2.8.91,
// Python with reportlab/pypdf, LibreOffice and Poppler (pdftoppm). No network access is used.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const { Presentation, PresentationFile } = await import(process.env.ARTIFACT_TOOL_MODULE || '@oai/artifact-tool');
const root = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(root, '.quarto', 'event-slide');
await fs.mkdir(build, { recursive: true });
execFileSync(process.env.SLIDE_PYTHON || 'python3', [path.join(root, 'scripts/qr.py'), build], { stdio: 'inherit' });

const presentation = Presentation.create({ slideSize: { width: 1600, height: 900 } });
const slide = presentation.slides.add();
slide.background.fill = '#0065BD';

function text(name, value, x, y, width, height, size, color = '#FFFFFF', bold = false) {
  const shape = slide.shapes.add({ name, geometry: 'textbox',
    position: { left: x, top: y, width, height }, fill: 'none',
    line: { fill: 'none', width: 0 } });
  shape.text = value;
  shape.text.style = { typeface: 'Arial', fontSize: size, color, bold,
    alignment: 'left', verticalAlignment: 'top', insets: 0, autoFit: 'none' };
  return shape;
}
async function image(name, filename, x, y, width, height) {
  const bytes = await fs.readFile(filename);
  slide.images.add({ name, blob: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    contentType: 'image/png', alt: name, fit: 'contain',
    position: { left: x, top: y, width, height } });
}

// Original supplied mark, unchanged, with its native 1822:590 proportions.
await image('Technische Universität München', path.join(root, 'assets/tum-de.png'), 1208, 40, 312, 312 * 590 / 1822);
await image('Bauhaus-style lark and owl', path.join(root, 'assets/lark-and-owl.png'), 692, 30, 216, 105);
for (const [language, label, x, headline, invitation, caption] of [
  ['en', 'English', 80, 'Early bird\nor night owl?', 'Discover your\nchronotype.', 'About 3 minutes.'],
  ['de', 'Deutsch', 850, 'Lerche\noder Eule?', 'Finde deinen\nChronotyp heraus.', 'Etwa 3 Minuten.']
]) {
  text(`Language ${language}`, label, x, 151, 600, 38, 26, '#D8ECFA');
  text(`Headline ${language}`, headline, x, 204, 670, 214, 84);
  await image(`QR code: ${label}`, path.join(build, `qr-${language}.png`), x, 464, 320, 320);
  text(`Invitation ${language}`, invitation, x + 350, 475, 322, 110, 33);
  text(`Practical details ${language}`, caption, x + 350, 622, 322, 83, 26, '#D8ECFA');
  text(`Scan instruction ${language}`, language === 'de' ? 'QR-Code scannen' : 'Scan the QR code', x + 350, 740, 322, 38, 24);
}
text('Website address', 'tscnlab.github.io/chronotypeTool', 80, 837, 900, 38, 24, '#D8ECFA');
slide.speakerNotes.text = 'Student-event invitation. QR codes open the published questionnaire directly in German and English. Original supplied TUM logo. The approximate three-minute duration describes the application. The Bauhaus-style lark-and-owl illustration was generated with the built-in image-generation tool; its prompt is recorded in event-slide.qmd. No scientific claim or participant data is shown.';

await (await PresentationFile.exportPptx(presentation)).save(path.join(build, 'candidate.pptx'));
await fs.writeFile(path.join(build, 'slide.layout.json'), await (await slide.export({ format: 'layout' })).text());
// Render the authored slide for comparison; export a vector PDF through LibreOffice.
// This avoids a missing standard-font module in artifact-tool 2.8.91's PDF exporter.
const preview = await presentation.export({ slide, format: 'png', scale: 1 });
await fs.writeFile(path.join(build, 'author-preview.png'), new Uint8Array(await preview.arrayBuffer()));
const exportEnv = { ...process.env };
const fontDir = process.env.SLIDE_FONT_DIR || (process.platform === 'darwin' ? '/System/Library/Fonts/Supplemental' : null);
if (fontDir) {
  const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  await fs.mkdir(path.join(build, 'font-cache'), { recursive: true });
  const config = path.join(build, 'fonts.conf');
  await fs.writeFile(config, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${xml(fontDir)}</dir><cachedir>${xml(path.join(build, 'font-cache'))}</cachedir></fontconfig>`);
  exportEnv.FONTCONFIG_FILE = config;
}
execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', build, path.join(build, 'candidate.pptx')], { stdio: 'inherit', env: exportEnv });
const pdf = path.join(root, 'assets/chronotype-invitation.pdf');
// LibreOffice rounds slide sizes to hundredths of a millimetre. Restore the
// intended exact 1200 × 675 pt page box without rasterising its content.
execFileSync(process.env.SLIDE_PYTHON || 'python3', ['-c', `from pypdf import PdfReader, PdfWriter
import sys
reader = PdfReader(sys.argv[1])
assert len(reader.pages) == 1
writer = PdfWriter()
writer.clone_document_from_reader(reader)
page = writer.pages[0]
page.mediabox.upper_right = (1200, 675)
page.cropbox.upper_right = (1200, 675)
with open(sys.argv[2], 'wb') as output:
    writer.write(output)
`, path.join(build, 'candidate.pdf'), pdf], { stdio: 'inherit' });
// The delivered PNG is rendered from the final PDF, so the two formats match.
execFileSync('pdftoppm', ['-singlefile', '-scale-to-x', '3840', '-scale-to-y', '2160', '-png', pdf, path.join(root, 'assets/chronotype-invitation')], { stdio: 'inherit' });
console.log('Created 16:9 PDF and 3840 × 2160 PNG in assets/.');
