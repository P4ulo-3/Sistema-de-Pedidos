import fs from "fs";

const outDir = "./public/icons";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function makeIcon(Jimp, size, file) {
  const image = await new Jimp({ width: size, height: size, color: "#ef4444" });
  // simple placeholder: draw a smaller contrasting square
  const inset = Math.round(size * 0.15);
  const inner = await new Jimp({
    width: size - inset * 2,
    height: size - inset * 2,
    color: "#ffffff",
  });
  image.composite(inner, inset, inset);
  await image.write(file);
  console.log("Wrote", file);
}

async function run() {
  const mod = await import("jimp");
  const Jimp = mod.Jimp || mod.default || mod;
  // attach font constants and helpers from mod onto Jimp if present
  if (mod.loadFont) Jimp.loadFont = mod.loadFont;
  if (mod.measureText) Jimp.measureText = mod.measureText;
  if (mod.measureTextHeight) Jimp.measureTextHeight = mod.measureTextHeight;
  if (mod.FONT_SANS_64_WHITE) Jimp.FONT_SANS_64_WHITE = mod.FONT_SANS_64_WHITE;
  if (mod.FONT_SANS_128_WHITE)
    Jimp.FONT_SANS_128_WHITE = mod.FONT_SANS_128_WHITE;
  console.log("Generating 192...");
  try {
    await makeIcon(Jimp, 192, "./public/icons/icon-192.png");
  } catch (e) {
    console.error("Failed 192", e);
  }
  console.log("Generating 512...");
  try {
    await makeIcon(Jimp, 512, "./public/icons/icon-512.png");
  } catch (e) {
    console.error("Failed 512", e);
  }

  // maskable icon (same size but different inset)
  console.log("Generating maskable 512...");
  try {
    const size = 512;
    const image = await new Jimp({
      width: size,
      height: size,
      color: "#ef4444",
    });
    const inset = Math.round(size * 0.06);
    const inner = await new Jimp({
      width: size - inset * 2,
      height: size - inset * 2,
      color: "#ffffff",
    });
    image.composite(inner, inset, inset);
    await image.write("./public/icons/icon-512-maskable.png");
    console.log("Wrote ./public/icons/icon-512-maskable.png");
  } catch (e) {
    console.error("Failed maskable", e);
  }

  // screenshots
  console.log("Generating screenshot wide (1280x720)...");
  try {
    const w = 1280,
      h = 720;
    const image = await new Jimp({ width: w, height: h, color: "#ffffff" });
    const band = await new Jimp({
      width: w - 80,
      height: h - 160,
      color: "#ef4444",
    });
    image.composite(band, 40, 80);
    await image.write("./public/icons/screenshot-wide.png");
    console.log("Wrote ./public/icons/screenshot-wide.png");
  } catch (e) {
    console.error("Failed screenshot wide", e);
  }

  console.log("Generating screenshot portrait (720x1280)...");
  try {
    const w = 720,
      h = 1280;
    const image = await new Jimp({ width: w, height: h, color: "#ffffff" });
    const band = await new Jimp({
      width: w - 80,
      height: h - 160,
      color: "#ef4444",
    });
    image.composite(band, 40, 80);
    await image.write("./public/icons/screenshot-portrait.png");
    console.log("Wrote ./public/icons/screenshot-portrait.png");
  } catch (e) {
    console.error("Failed screenshot portrait", e);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
