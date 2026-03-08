import prisma from "../db.js";
import cloudinary from "../services/cloudinary.js";

function parsePrice(price) {
  const parsed = Number(price);
  return Number.isFinite(parsed) ? parsed : null;
}

async function listProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: {
        NOT: { name: { startsWith: "[CANCELADO]" } },
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(products);
  } catch (error) {
    return next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, description, price, categoryId } = req.body;
    const parsedPrice = parsePrice(price);

    if (!name || parsedPrice === null) {
      return res.status(400).json({ message: "name e price são obrigatórios" });
    }

    let imageUrl = null;
    if (req.file) {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploaded = await cloudinary.uploader.upload(dataUri, {
        folder: "products",
      });
      imageUrl = uploaded.secure_url;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parsedPrice,
        imageUrl,
        categoryId: categoryId || null,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, imageUrl } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    // if a new file was uploaded via multipart, upload to Cloudinary and override imageUrl
    if (req.file) {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploaded = await cloudinary.uploader.upload(dataUri, {
        folder: "products",
      });
      updateData.imageUrl = uploaded.secure_url;
    }
    if (price !== undefined) {
      const parsedPrice = parsePrice(price);
      if (parsedPrice === null) {
        return res.status(400).json({ message: "price inválido" });
      }
      updateData.price = parsedPrice;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }
    // If product is referenced in any order items, avoid hard delete
    const hasUsage = await prisma.orderItem.findFirst({
      where: { productId: id },
    });
    if (hasUsage) {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: `[CANCELADO] ${existing.name}`,
          price: 0,
          imageUrl: null,
          categoryId: null,
        },
      });
      return res.json({
        message: "Produto cancelado (possui associações)",
        product: updated,
      });
    }

    await prisma.product.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
