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
    const { table, items } = req.body;

    if (!table || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "table e items são obrigatórios" });
    }

    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res
        .status(400)
        .json({ message: "Um ou mais produtos não existem" });
    }

    const priceById = products.reduce((acc, product) => {
      acc[product.id] = product.price;
      return acc;
    }, {});

    const order = await prisma.order.create({
      data: {
        table,
        waiterId: req.user.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
            unitPrice: priceById[item.productId],
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        waiter: {
          select: { id: true, name: true, role: true },
        },
      },
    });

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
          return res
            .status(400)
            .json({
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
    const { table, items } = req.body;

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

    const productIds = items.map((it) => it.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
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

    const updated = await prisma.order.update({
      where: { id },
      data: {
        table,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            unitPrice: priceById[item.productId],
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        waiter: { select: { id: true, name: true, role: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export { createOrder, listOrders, updateOrderStatus, updateOrder };
