#!/usr/bin/env node
/**
 * Media pipeline: turns the client's source files in /assets into the
 * optimised files the landing page ships.
 *
 *   assets/logo/logo-pratorapido.png → vector mark (TS module), favicons, PWA icons
 *   assets/phone-pr.png              → the app's access screen, cropped to the display
 *   assets/video-food.mp4            → hero film (desktop + phone), posters, dish still
 *
 * Run: npm run media      (re-run whenever a source file changes)
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import pngToIco from 'png-to-ico';
import potrace from 'potrace';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = {
  logo: path.join(ROOT, 'assets/logo/logo-pratorapido.png'),
  phone: path.join(ROOT, 'assets/phone-pr.png'),
  video: path.join(ROOT, 'assets/video-food.mp4'),
};
const OUT = {
  generated: path.join(ROOT, 'client/src/assets/generated'),
  public: path.join(ROOT, 'client/public'),
  media: path.join(ROOT, 'client/public/media'),
};

const BRAND = { orange: '#FE6505', slate: '#11161B', ink: '#F3F4F6' };
const FFMPEG = ffmpegInstaller.path;

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
const log = (label, detail = '') => console.log(`  ${label.padEnd(34)} ${detail}`);

async function sizeOf(file) {
  return (await stat(file)).size;
}

/* -------------------------------------------------------------------------
 * 1. Logo → vector mark
 * ---------------------------------------------------------------------- */

const traceBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    potrace.trace(buffer, options, (error, svg) => (error ? reject(error) : resolve(svg)));
  });

/** The path's `d`, numbers rounded to 0.1 (the viewBox is 2x: sub-pixel either way). */
const pathData = (svg) => {
  const match = /<path[^>]*\sd="([^"]+)"/.exec(svg);
  if (!match) throw new Error('potrace returned no path');
  return match[1]
    .replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10))
    .replace(/,\s*/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Separates the two inks of the logo (slate outline and orange) from the
 * white paper by un-mixing each pixel: red tells slate from paper (orange
 * and paper share red ≈ 255), blue then gives the orange coverage.
 */
async function traceLogoMark() {
  const { data, info } = await sharp(SRC.logo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const slate = new Float32Array(W * H);
  const orange = new Float32Array(W * H);
  for (let i = 0, p = 0; p < W * H; p += 1, i += C) {
    const r = data[i];
    const b = data[i + 2];
    const s = Math.min(1, Math.max(0, (255 - r) / 238));
    const o = Math.min(1, Math.max(0, (255 - b - 228 * s) / 250));
    slate[p] = s;
    orange[p] = o;
  }

  // The mark sits above the wordmark: everything up to the first wide empty band.
  const MARK_BOTTOM = 505;
  let x0 = W;
  let y0 = H;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < MARK_BOTTOM; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const p = y * W + x;
      if (slate[p] > 0.5 || orange[p] > 0.5) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const pad = 6;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(W - 1, x1 + pad);
  y1 = Math.min(H - 1, y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;

  const layer = async (coverage) => {
    const gray = Buffer.alloc(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        gray[y * w + x] = Math.round(255 * (1 - coverage[(y + y0) * W + (x + x0)]));
      }
    }
    // Trace at 2x for smoother curves, then scale the path back down.
    const png = await sharp(gray, { raw: { width: w, height: h, channels: 1 } })
      .resize(w * 2, h * 2, { kernel: 'lanczos3' })
      .png()
      .toBuffer();
    return pathData(await traceBuffer(png, { threshold: 128, turdSize: 8, optTolerance: 0.35, alphaMax: 1 }));
  };

  const outline = await layer(slate);
  const accent = await layer(orange);
  return { outline, accent, width: w * 2, height: h * 2 };
}

/* -------------------------------------------------------------------------
 * 2. Favicons and app icons (the mark on a slate tile)
 * ---------------------------------------------------------------------- */

function tileSvg(mark, { size = 512, radius = 112, scale = 0.78, background = BRAND.slate } = {}) {
  const inner = size * scale;
  const k = Math.min(inner / mark.width, inner / mark.height);
  const tx = (size - mark.width * k) / 2;
  const ty = (size - mark.height * k) / 2 + size * 0.01;
  const rect = radius > 0 ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>` : `<rect width="${size}" height="${size}" fill="${background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rect}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(5)})"><path fill="${BRAND.ink}" d="${mark.outline}"/><path fill="${BRAND.orange}" d="${mark.accent}"/></g></svg>`;
}

async function buildIcons(mark) {
  await mkdir(OUT.public, { recursive: true });

  const faviconSvg = tileSvg(mark, { size: 64, radius: 14, scale: 0.86 });
  await writeFile(path.join(OUT.public, 'favicon.svg'), faviconSvg);
  log('favicon.svg', kib(Buffer.byteLength(faviconSvg)));

  const render = (svg, px) => sharp(Buffer.from(svg), { density: 384 }).resize(px, px).png({ compressionLevel: 9 }).toBuffer();

  const small = tileSvg(mark, { size: 64, radius: 14, scale: 0.88 });
  const ico = await pngToIco([await render(small, 16), await render(small, 32), await render(small, 48)]);
  await writeFile(path.join(OUT.public, 'favicon.ico'), ico);
  log('favicon.ico (16, 32, 48)', kib(ico.length));

  const icons = [
    { file: 'apple-touch-icon.png', px: 180, opts: { radius: 0, scale: 0.72 } },
    { file: 'icon-192.png', px: 192, opts: { radius: 42, scale: 0.76 } },
    { file: 'icon-512.png', px: 512, opts: { radius: 112, scale: 0.76 } },
    { file: 'icon-maskable-512.png', px: 512, opts: { radius: 0, scale: 0.58 } },
  ];
  for (const icon of icons) {
    const buffer = await render(tileSvg(mark, { size: 512, ...icon.opts }), icon.px);
    await writeFile(path.join(OUT.public, icon.file), buffer);
    log(icon.file, kib(buffer.length));
  }
}

async function writeLogoModule(mark) {
  await mkdir(OUT.generated, { recursive: true });
  const ts = `/* Generated by scripts/build-media.mjs from assets/logo/logo-pratorapido.png. Do not edit. */
export const logoMark = {
  viewBox: '0 0 ${mark.width} ${mark.height}',
  width: ${mark.width},
  height: ${mark.height},
  /** Hat and cloche (the logo's slate ink). */
  outline: '${mark.outline}',
  /** Speed lines (the logo's orange). */
  accent: '${mark.accent}',
} as const;
`;
  await writeFile(path.join(OUT.generated, 'logo.ts'), ts);
  log('src/assets/generated/logo.ts', kib(Buffer.byteLength(ts)));
}

/* -------------------------------------------------------------------------
 * 3. The app's access screen (client screenshot) → screen-only crop
 * ---------------------------------------------------------------------- */

async function buildAccessScreen() {
  // Screen area inside the device in assets/phone-pr.png, at the iPhone ratio 393:852.
  const crop = { left: 110, top: 51, width: 722, height: 1565 };
  for (const width of [640, 400]) {
    const file = path.join(OUT.generated, `access-screen-${width}.webp`);
    await sharp(SRC.phone)
      .extract(crop)
      .resize({ width })
      .webp({ quality: 82, effort: 6, smartSubsample: true })
      .toFile(file);
    log(path.relative(ROOT, file), kib(await sizeOf(file)));
  }
}

/* -------------------------------------------------------------------------
 * 4. Hero film: desktop + phone encodes, posters, a still for the app mock
 * ---------------------------------------------------------------------- */

async function probeVideo() {
  // ffmpeg prints stream info to stderr and exits 1 without an output file.
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', SRC.video]).catch((error) => error);
  const duration = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(stderr);
  const size = /Video:.*?(\d{3,5})x(\d{3,5})/.exec(stderr);
  const fps = /(\d+(?:\.\d+)?) fps/.exec(stderr);
  if (!duration || !size) throw new Error(`Could not read the video:\n${stderr}`);
  const seconds = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
  return { seconds, width: Number(size[1]), height: Number(size[2]), fps: fps ? Number(fps[1]) : 30 };
}

async function encode(args, file) {
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args, file], { maxBuffer: 1024 * 1024 * 32 });
  log(path.relative(ROOT, file), kib(await sizeOf(file)));
}

/**
 * Seamless loop: the film plays from `f` to the end, and its last `f` frames
 * crossfade into its first `f` frames, so the last output frame flows into
 * the first one with no jump. Works on ffmpeg 4.1 (blend filter, no xfade).
 */
function loopGraph({ frames, fade, fps, framing }) {
  const seconds = (fade / fps).toFixed(4);
  return [
    `[0:v]${framing},setsar=1,split=3[a][b][c]`,
    `[a]trim=start_frame=${fade}:end_frame=${frames - fade},setpts=PTS-STARTPTS[body]`,
    `[b]trim=start_frame=${frames - fade}:end_frame=${frames},setpts=PTS-STARTPTS[tail]`,
    `[c]trim=start_frame=0:end_frame=${fade},setpts=PTS-STARTPTS[head]`,
    `[tail][head]blend=all_expr='A*(1-T/${seconds})+B*(T/${seconds})'[mix]`,
    `[body][mix]concat=n=2:v=1:a=0,format=yuv420p[out]`,
  ].join(';');
}

async function buildVideo() {
  await mkdir(OUT.media, { recursive: true });
  const info = await probeVideo();
  log('source', `${info.width}x${info.height}, ${info.seconds.toFixed(2)} s, ${info.fps} fps`);

  const fps = Math.round(info.fps);
  const frames = Math.floor(info.seconds * fps);
  const fade = Math.round(fps * 0.8);
  const portrait = info.height > info.width;

  // Desktop: a 4:5 window on the dish, centred a little above the middle
  // (the salmon), at 800x1000: the frame shows about 400 CSS px wide, so this
  // is a 2x file. Phones: the full 9:16 frame.
  const desktopFraming = portrait
    ? `crop=iw:iw*5/4:0:(ih-iw*5/4)*0.42,scale=800:1000:flags=lanczos`
    : `crop=ih*4/5:ih,scale=800:1000:flags=lanczos`;
  const phoneFraming = portrait ? `scale=720:1280:flags=lanczos` : `crop=ih*9/16:ih,scale=720:1280:flags=lanczos`;

  const x264 = ['-an', '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps)];
  const outputs = [
    { name: 'hero-desktop', framing: desktopFraming, rate: ['-crf', '27', '-maxrate', '2000k', '-bufsize', '4000k'] },
    { name: 'hero-phone', framing: phoneFraming, rate: ['-crf', '29', '-maxrate', '1600k', '-bufsize', '3200k'] },
  ];

  for (const output of outputs) {
    const file = path.join(OUT.media, `${output.name}.mp4`);
    await encode(
      ['-i', SRC.video, '-filter_complex', loopGraph({ frames, fade, fps, framing: output.framing }), '-map', '[out]', ...output.rate, ...x264],
      file,
    );
    // Poster = the encode's own first frame, so playback starts exactly on it.
    // Sized for a 2x screen at the frame's shown width (about 400 CSS px on desktop).
    const tmp = path.join(OUT.media, `${output.name}.tmp.png`);
    await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-frames:v', '1', tmp]);
    const poster = path.join(OUT.media, `${output.name}-poster.webp`);
    await sharp(tmp)
      .resize({ width: output.name === 'hero-desktop' ? 800 : 720 })
      .webp({ quality: 74, effort: 6 })
      .toFile(poster);
    log(path.relative(ROOT, poster), kib(await sizeOf(poster)));
    if (output.name === 'hero-desktop') await buildAmbient(tmp);
    await rm(tmp);
  }

  return info;
}

/**
 * Ambient light for the hero ground: the film's first frame pre-blurred, with
 * its radial fade baked into the alpha channel, so the page needs no CSS
 * filter or mask (a live blur over a large area is re-composited on every
 * video frame, which slow GPUs and software rendering pay for).
 */
async function buildAmbient(source) {
  const W = 320;
  const H = 400;
  const fade = Buffer.from(
    // The fade reaches full transparency inside the box (r < 50%), so no edge ever shows.
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="50%" r="47%"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`,
  );
  const mask = await sharp(fade).png().toBuffer();
  const blurred = await sharp(source)
    .resize(W, H, { fit: 'cover' })
    .blur(28)
    .modulate({ brightness: 0.85, saturation: 1.15 })
    .ensureAlpha()
    .png()
    .toBuffer();
  const file = path.join(OUT.media, 'hero-ambient.webp');
  // dest-in keeps the image only where the mask is opaque: the fade becomes alpha.
  await sharp(blurred)
    .composite([{ input: mask, blend: 'dest-in' }])
    .webp({ quality: 70, alphaQuality: 80 })
    .toFile(file);
  log(path.relative(ROOT, file), kib(await sizeOf(file)));
}

async function buildDishStill(info, at) {
  const tmp = path.join(OUT.generated, 'dish.tmp.png');
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(at), '-i', SRC.video, '-frames:v', '1', tmp]);
  const { width = 0, height = 0 } = await sharp(tmp).metadata();
  // A 3:2 band across the full width, centred on the salmon (about 46% down the frame).
  const bandHeight = Math.round((width * 2) / 3);
  const top = Math.max(0, Math.min(height - bandHeight, Math.round(height * 0.46 - bandHeight / 2)));
  // Shown about 270 CSS px wide in the desktop phone, 195 on phones: 2x files for each.
  for (const w of [560, 400]) {
    const file = path.join(OUT.generated, `dish-${w}.webp`);
    await sharp(tmp)
      .extract({ left: 0, top, width, height: bandHeight })
      .resize({ width: w, height: Math.round((w * 2) / 3), fit: 'cover' })
      .webp({ quality: 78, effort: 6 })
      .toFile(file);
    log(path.relative(ROOT, file), kib(await sizeOf(file)));
  }
  await rm(tmp);
  return info;
}

/* ---------------------------------------------------------------------- */

async function main() {
  const only = new Set(process.argv.slice(2));
  const want = (step) => only.size === 0 || only.has(step);
  console.log('Prato Rápido · media pipeline');

  if (want('logo')) {
    console.log('\nLogo');
    const mark = await traceLogoMark();
    await writeLogoModule(mark);
    await buildIcons(mark);
  }
  if (want('screen')) {
    console.log('\nAccess screen');
    await buildAccessScreen();
  }
  if (want('video')) {
    console.log('\nHero film');
    const info = await buildVideo();
    const dishAt = Number(process.env.DISH_AT ?? Math.min(info.seconds * 0.72, 6));
    await buildDishStill(info, dishAt);
  } else {
    if (want('ambient')) {
      console.log('\nAmbient light (from the existing desktop poster)');
      await buildAmbient(path.join(OUT.media, 'hero-desktop-poster.webp'));
    }
    if (want('stills')) {
      console.log('\nStills (no video re-encode)');
      const info = await probeVideo();
      await buildDishStill(info, Number(process.env.DISH_AT ?? Math.min(info.seconds * 0.72, 6)));
      const poster = path.join(OUT.media, 'hero-desktop-poster.webp');
      // Read into memory first: on Windows libvips keeps an input file open, which blocks overwriting it.
      const resized = await sharp(await readFile(poster)).resize({ width: 800 }).webp({ quality: 74, effort: 6 }).toBuffer();
      await writeFile(poster, resized);
      log(path.relative(ROOT, poster), kib(resized.length));
    }
  }
  console.log('\nDone.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
