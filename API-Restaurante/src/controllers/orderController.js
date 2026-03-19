import prisma from "../db.js";

const allowedStatuses = [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELED",
];

async function createOrder(req, res, next) {
  try {
    const { table, items, customer, notes } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    if ((!table && !customer) || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "table (ou customer) e items são obrigatórios" });
    }

    // items must be objects with valid productId
    if (!items.every((it) => it && typeof it.productId === "string")) {
      return res
        .status(400)
        .json({ message: "Cada item precisa ter productId válido" });
    }

    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    if (products.length !== uniqueProductIds.length) {
      return res
        .status(400)
        .json({ message: "Um ou mais produtos não existem" });
    }

    const priceById = products.reduce((acc, product) => {
      acc[product.id] = product.price;
      return acc;
    }, {});

    // validate resolved prices for each item and build create payload
    const itemsCreate = [];
    for (const it of items) {
      if (!priceById.hasOwnProperty(it.productId)) {
        return res
          .status(400)
          .json({ message: "Um ou mais produtos não existem" });
      }

      const qty = Number(it.quantity) > 0 ? Number(it.quantity) : 1;
      const unitPrice = Number(priceById[it.productId]);
      if (!isFinite(unitPrice)) {
        return res
          .status(400)
          .json({ message: `Preço inválido para o produto ${it.productId}` });
      }

      itemsCreate.push({ productId: it.productId, quantity: qty, unitPrice });
    }

    // ensure table is string or null
    const tableValue = table == null ? null : String(table).trim();

    // debug: log payload to help diagnose Prisma validation issues (visible in server logs)
    console.debug("Creating order payload", {
      waiterId: req.user.id,
      tableValue,
      itemsCreate,
    });

    let order;
    try {
      order = await prisma.order.create({
        data: {
          table: tableValue || null,
          customer: customer || null,
          notes: notes || null,
          waiterId: req.user.id,
          items: { create: itemsCreate },
        },
        include: {
          items: { include: { product: true } },
          waiter: { select: { id: true, name: true, role: true } },
        },
      });
    } catch (e) {
      // handle Prisma validation / known errors and return 400 with code/message
      if (
        e &&
        (e.name === "PrismaClientValidationError" ||
          e.name === "PrismaClientKnownRequestError" ||
          typeof e.code === "string")
      ) {
        console.error("Prisma error creating order:", e);
        return res.status(400).json({
          message: "Dados inválidos para criação do pedido",
          code: e.code || e.name,
          detail: e.message,
          meta: e.meta || null,
        });
      }
      console.error("Unexpected error creating order:", e);
      throw e;
    }

    // mark table as occupied if a table record exists
    try {
      const tableNumber = Number(table);
      if (!Number.isNaN(tableNumber)) {
        await prisma.table.update({
          where: { number: tableNumber },
          data: { status: "OCCUPIED" },
        });
      }
    } catch (e) {
      // ignore if table record not found - table may not be managed by admin yet
    }

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }

async function listOrders(req, res, next) {
  try {
    const { status, date } = req.query;
    const where = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      where.status = status;
    }

    // date filter expects YYYY-MM-DD
    if (date) {
      const start = new Date(date);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        where.createdAt = { gte: start, lt: end };
      }
    }

    if (req.user.role === "waiter") {
      where.waiterId = req.user.id;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
        waiter: {
          select: { id: true, name: true, role: true },
        },
        // include optional fields
        // Prisma will include customer and notes automatically as they are columns
      },
    });

    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    // If waiter is requesting, allow cancel or closing (DELIVERED) for own orders
    if (req.user.role === "waiter") {
      if (!["CANCELED", "DELIVERED"].includes(status)) {
        return res
          .status(403)
          .json({ message: "Waiter só pode cancelar ou fechar comanda" });
      }
      if (existing.waiterId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Não autorizado para alterar este pedido" });
      }

      if (status === "CANCELED") {
        if (existing.status !== "PENDING") {
          return res.status(400).json({
            message: "Somente pedidos pendentes podem ser cancelados",
          });
        }
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          items: { include: { product: true } },
          waiter: { select: { id: true, name: true, role: true } },
        },
      });

      // if order is finished or canceled, try to free the table
      try {
        const tableNumber = Number(updated.table);
        if (
          !Number.isNaN(tableNumber) &&
          (status === "DELIVERED" || status === "CANCELED")
        ) {
          await prisma.table.update({
            where: { number: tableNumber },
            data: { status: "FREE" },
          });
        }
      } catch (e) {
        // ignore if table not managed
      }

      return res.json(updated);
    }

    // kitchen/admin can change status freely (validated earlier)
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        waiter: { select: { id: true, name: true, role: true } },
      },
    });

    // if order is finished or canceled, try to free the table
    try {
      const tableNumber = Number(updated.table);
      if (
        updated.table &&
        !Number.isNaN(tableNumber) &&
        (status === "DELIVERED" || status === "CANCELED")
      ) {
        await prisma.table.update({
          where: { number: tableNumber },
          data: { status: "FREE" },
        });
      }
    } catch (e) {
      // ignore if table not managed
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { table, items, customer, notes } = req.body;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing)
      return res.status(404).json({ message: "Pedido não encontrado" });

    if (existing.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Só é possível editar pedidos pendentes" });
    }

    if (!table || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "table e items são obrigatórios" });
    }

    if (!items.every((it) => it && typeof it.productId === "string")) {
      return res
        .status(400)
        .json({ message: "Cada item precisa ter productId válido" });
    }

    const productIds = items.map((it) => it.productId);
    const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });
    if (products.length !== uniqueProductIds.length) {
      return res
        .status(400)
        .json({ message: "Um ou mais produtos não existem" });
    }

    const priceById = products.reduce((acc, p) => {
      acc[p.id] = p.price;
      return acc;
    }, {});

    // replace items
    await prisma.orderItem.deleteMany({ where: { orderId: id } });

    const itemsCreate = items.map((it) => {
      const qty = Number(it.quantity) > 0 ? Number(it.quantity) : 1;
      const unitPrice = Number(priceById[it.productId]);
      if (!isFinite(unitPrice)) {
        throw new Error(`Preço inválido para o produto ${it.productId}`);
      }
      return { productId: it.productId, quantity: qty, unitPrice };
    });

    let updated;
    try {
      updated = await prisma.order.update({
        where: { id },
        data: {
          table: table || null,
          customer: customer || null,
          notes: notes || null,
          items: { create: itemsCreate },
        },
        include: {
          items: { include: { product: true } },
          waiter: { select: { id: true, name: true, role: true } },
        },
      });
    } catch (e) {
      if (e && e.name === "PrismaClientValidationError") {
        console.error("Prisma validation error updating order:", e.message);
        return res.status(400).json({
          message: "Dados inválidos para atualização do pedido",
          detail: e.message,
        });
      }
      throw e;
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export { createOrder, listOrders, updateOrderStatus, updateOrder };
