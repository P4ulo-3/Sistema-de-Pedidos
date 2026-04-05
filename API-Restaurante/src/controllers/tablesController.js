import prisma from "../db.js";

async function listTables(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.findMany !== "function") {
      return res.status(501).json({
        message:
          "Table model not available in Prisma Client. Regenerate client and redeploy.",
      });
    }

    const tables = await prisma.table.findMany({ orderBy: { number: "asc" } });
    return res.json(tables);
  } catch (error) {
    return next(error);
  }
}

async function createTable(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.create !== "function") {
      return res.status(501).json({
        message:
          "Table model not available in Prisma Client. Regenerate client and redeploy.",
      });
    }
    const { number } = req.body;
    if (number == null || Number.isNaN(Number(number))) {
      return res.status(400).json({ message: "Número da mesa inválido" });
    }
    const created = await prisma.table.create({
      data: { number: Number(number) },
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
}

async function updateTable(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.update !== "function") {
      return res.status(501).json({
        message:
          "Table model not available in Prisma Client. Regenerate client and redeploy.",
      });
    }
    const { id } = req.params;
    const { status, number } = req.body;
    const data = {};
    if (status) data.status = status;
    if (number != null && !Number.isNaN(Number(number)))
      data.number = Number(number);

    // find existing table to access its number (used to clear linked orders)
    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Table not found" });

    const updated = await prisma.table.update({ where: { id }, data });

    // If the table was marked FREE, disassociate any orders that referenced this table
    if (status === "FREE") {
      // orders store the table number (as string or number). Convert to string for comparison.
      const tableNumberStr = String(existing.number);
      await prisma.order.updateMany({
        where: { table: tableNumberStr },
        data: { table: null },
      });
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function deleteTable(req, res, next) {
  try {
    if (!prisma.table || typeof prisma.table.delete !== "function") {
      return res.status(501).json({
        message:
          "Table model not available in Prisma Client. Regenerate client and redeploy.",
      });
    }
    const { id } = req.params;
    await prisma.table.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export { listTables, createTable, updateTable, deleteTable };
