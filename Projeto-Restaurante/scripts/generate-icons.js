import fs from "fs";
import path from "path";

const outDir = "./public/icons";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function makeIconFromLogo(Jimp, size, file, opts = {}) {
  const bgColor = opts.bgColor || "#ef4444";
  const logoPath = "./public/icons/logo-pedidos-512.png";

  const image = await new Jimp({ width: size, height: size, color: bgColor });

  if (fs.existsSync(logoPath)) {
    try {
      const logo = await Jimp.read(logoPath);
      // scale logo to fit within 70% of icon size
      const maxLogo = Math.round(size * 0.7);
      if (logo.bitmap.width > logo.bitmap.height) {
        logo.resize(maxLogo, Jimp.AUTO);
      } else {
        logo.resize(Jimp.AUTO, maxLogo);
      }
      const x = Math.round((size - logo.bitmap.width) / 2);
      const y = Math.round((size - logo.bitmap.height) / 2);
      image.composite(logo, x, y, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1,
      });
      await image.writeAsync(file);
      console.log("Wrote", file);
      return;
    } catch (e) {
      console.error(
        "Failed to read or composite logo, falling back to placeholder:",
        e,
      );
    }
  }

  // fallback placeholder: centered white square
  const inset = Math.round(size * 0.15);
  const inner = await new Jimp({
    width: size - inset * 2,
    height: size - inset * 2,
    color: "#ffffff",
  });
  image.composite(inner, inset, inset);
  await image.writeAsync(file);
  console.log("Wrote placeholder", file);
}

async function run() {
  // prefer sharp for reliable resizing if available
  let Sharp;
  try {
    Sharp = (await import("sharp")).default || (await import("sharp"));
  } catch (e) {
    Sharp = null;
  }

  const sizes = [48, 72, 96, 144, 192, 512];
  for (const s of sizes) {
    const out = `./public/icons/icon-${s}.png`;
    try {
      if (Sharp && fs.existsSync("./public/icons/logo-pedidos-512.png")) {
        await Sharp("./public/icons/logo-pedidos-512.png")
          .resize(s, s, { fit: "contain", background: "#ef4444" })
          .png()
          .toFile(out);
        console.log("Wrote", out, "(sharp)");
      } else {
        const mod = await import("jimp");
        const Jimp = mod.Jimp || mod.default || mod;
        await makeIconFromLogo(Jimp, s, out);
      }
    } catch (e) {
      console.error(`Failed ${s}`, e);
    }
  }

  // maskable icon
  try {
    const out = "./public/icons/icon-512-maskable.png";
    if (Sharp && fs.existsSync("./public/icons/logo-pedidos-512.png")) {
      await Sharp("./public/icons/logo-pedidos-512.png")
        .resize(512, 512, { fit: "contain", background: "#ef4444" })
        .png()
        .toFile(out);
      console.log("Wrote", out, "(sharp)");
    } else {
      const mod = await import("jimp");
      const Jimp = mod.Jimp || mod.default || mod;
      await makeIconFromLogo(Jimp, 512, out, { bgColor: "#ef4444" });
      console.log("Wrote", out);
    }
  } catch (e) {
    console.error("Failed maskable", e);
  }

  // screenshots (placeholders)
  try {
    const w = 1280,
      h = 720;
    const mod = await import("jimp");
    const Jimp = mod.Jimp || mod.default || mod;
    const image = await new Jimp({ width: w, height: h, color: "#ffffff" });
    const band = await new Jimp({
      width: w - 80,
      height: h - 160,
      color: "#ef4444",
    });
    image.composite(band, 40, 80);
    await image.writeAsync("./public/icons/screenshot-wide.png");
    console.log("Wrote ./public/icons/screenshot-wide.png");
  } catch (e) {
    console.error("Failed screenshot wide", e);
  }

  try {
    const w = 720,
      h = 1280;
    const mod = await import("jimp");
    const Jimp = mod.Jimp || mod.default || mod;
    const image = await new Jimp({ width: w, height: h, color: "#ffffff" });
    const band = await new Jimp({
      width: w - 80,
      height: h - 160,
      color: "#ef4444",
    });
    image.composite(band, 40, 80);
    await image.writeAsync("./public/icons/screenshot-portrait.png");
    console.log("Wrote ./public/icons/screenshot-portrait.png");
  } catch (e) {
    console.error("Failed screenshot portrait", e);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
