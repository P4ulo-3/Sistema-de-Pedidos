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

    // prepare base data for create
    const createDataBase = {
      table: tableValue || null,
      customer: customer || null,
      notes: notes || null,
      waiterId: req.user.id,
      items: { create: itemsCreate },
    };

    // attempt create with fallback: if Prisma reports Unknown argument, remove and retry
    let order;
    try {
      let dataToUse = { ...createDataBase };
      let attempts = 0;
      const maxAttempts = 4;
      while (true) {
        attempts++;
        try {
          order = await prisma.order.create({
            data: dataToUse,
            include: {
              items: { include: { product: true } },
              waiter: { select: { id: true, name: true, role: true } },
            },
          });
          break;
        } catch (innerErr) {
          const msg =
            innerErr && innerErr.message ? String(innerErr.message) : "";
          const unknownArgs = [];
          const re = /Unknown argument `([^`]+)`/g;
          let m;
          while ((m = re.exec(msg)) !== null) unknownArgs.push(m[1]);

          if (unknownArgs.length === 0 || attempts >= maxAttempts) {
            // return the Prisma error with details to the client
            console.error("Prisma error creating order:", innerErr);
            if (
              innerErr &&
              (innerErr.name === "PrismaClientValidationError" ||
                innerErr.name === "PrismaClientKnownRequestError" ||
                typeof innerErr.code === "string")
            ) {
              return res.status(400).json({
                message: "Dados inválidos para criação do pedido",
                code: innerErr.code || innerErr.name,
                detail: innerErr.message,
                meta: innerErr.meta || null,
              });
            }
            throw innerErr;
          }

          // remove unknown args from dataToUse and retry
          console.warn(
            "Prisma reported unknown args, removing and retrying:",
            unknownArgs,
          );
          for (const a of unknownArgs) {
            if (Object.prototype.hasOwnProperty.call(dataToUse, a))
              delete dataToUse[a];
          }
          // loop to retry
        }
      }
    } catch (e) {
      console.error("Unexpected error creating order:", e);
      return next(e);
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

      // if order is canceled, try to free the table
      try {
        const tableNumber = Number(updated.table);
        if (!Number.isNaN(tableNumber) && status === "CANCELED") {
          await prisma.table.update({
            where: { number: tableNumber },
            data: { status: "FREE" },
          });
        }
        // NOTE: do NOT free table automatically when status === DELIVERED.
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

    // if order is canceled, try to free the table
    try {
      const tableNumber = Number(updated.table);
      if (
        updated.table &&
        !Number.isNaN(tableNumber) &&
        status === "CANCELED"
      ) {
        await prisma.table.update({
          where: { number: tableNumber },
          data: { status: "FREE" },
        });
      }
      // NOTE: do NOT free table automatically when status === DELIVERED.
      // The table must be marked free explicitly by the waiter to match
      // the requested behavior where delivered orders keep the table occupied.
    } catch (e) {
      // ignore if table not managed
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function closeComanda(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Pedido não encontrado" });

    // waiter can only close their own orders
    if (req.user.role === "waiter" && existing.waiterId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Não autorizado para fechar esta comanda" });
    }

    // If there's a table number, try to mark it free. Return 204 on success.
    try {
      const tableNumber = Number(existing.table);
      if (!Number.isNaN(tableNumber)) {
        await prisma.table.update({
          where: { number: tableNumber },
          data: { status: "FREE" },
        });
      }
    } catch (e) {
      // ignore if table not managed
    }

    return res
      .status(200)
      .json({ message: "Comanda fechada e mesa marcada como livre" });
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

    // Allow editing for non-canceled orders. Waiters can only edit their own orders.
    if (existing.status === "CANCELED") {
      return res
        .status(400)
        .json({ message: "Não é possível editar pedidos cancelados" });
    }
    if (req.user.role === "waiter" && existing.waiterId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Não autorizado para alterar este pedido" });
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

    // prepare update data and attempt with fallback for unknown args
    const updateBase = {
      table: table || null,
      customer: customer || null,
      notes: notes || null,
      items: { create: itemsCreate },
    };

    let updated;
    try {
      let dataToUse = { ...updateBase };
      let attempts = 0;
      const maxAttempts = 4;
      while (true) {
        attempts++;
        try {
          updated = await prisma.order.update({
            where: { id },
            data: dataToUse,
            include: {
              items: { include: { product: true } },
              waiter: { select: { id: true, name: true, role: true } },
            },
          });
          break;
        } catch (innerErr) {
          const msg =
            innerErr && innerErr.message ? String(innerErr.message) : "";
          const unknownArgs = [];
          const re = /Unknown argument `([^`]+)`/g;
          let m;
          while ((m = re.exec(msg)) !== null) unknownArgs.push(m[1]);

          if (unknownArgs.length === 0 || attempts >= maxAttempts) {
            console.error("Prisma error updating order:", innerErr);
            if (innerErr && innerErr.name === "PrismaClientValidationError") {
              return res.status(400).json({
                message: "Dados inválidos para atualização do pedido",
                detail: innerErr.message,
              });
            }
            throw innerErr;
          }

          console.warn(
            "Prisma reported unknown args on update, removing and retrying:",
            unknownArgs,
          );
          for (const a of unknownArgs) {
            if (Object.prototype.hasOwnProperty.call(dataToUse, a))
              delete dataToUse[a];
          }
        }
      }
    } catch (e) {
      console.error("Unexpected error updating order:", e);
      return next(e);
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

export {
  createOrder,
  listOrders,
  updateOrderStatus,
  updateOrder,
  closeComanda,
};
