import prisma from "../db.js";

/**
 * GET /finance/summary?period=day|week|month&date=YYYY-MM-DD
 * Returns total revenue and order count for the requested period.
 */
async function financeSummary(req, res, next) {
  try {
    const { period = "day", date } = req.query;
    const { start, end } = buildRange(period, date);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { notIn: ["CANCELED"] },
      },
      include: { items: true },
    });

    const totalRevenue = orders.reduce(
      (sum, o) =>
        sum + o.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0),
      0,
    );

    return res.json({
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /finance/waiters?period=day|week|month&date=YYYY-MM-DD
 * Returns per-waiter stats: tables served, average ticket, total revenue.
 */
async function financeWaiters(req, res, next) {
  try {
    const { period = "day", date } = req.query;
    const { start, end } = buildRange(period, date);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { notIn: ["CANCELED"] },
      },
      include: {
        items: true,
        waiter: { select: { id: true, name: true } },
      },
    });

    // group by waiter
    const map = {};
    for (const o of orders) {
      const wid = o.waiterId;
      if (!map[wid]) {
        map[wid] = {
          waiterId: wid,
          waiterName: o.waiter?.name || "—",
          tables: new Set(),
          totalOrders: 0,
          totalRevenue: 0,
        };
      }
      map[wid].totalOrders += 1;
      if (o.table) map[wid].tables.add(o.table);
      map[wid].totalRevenue += o.items.reduce(
        (s, it) => s + it.unitPrice * it.quantity,
        0,
      );
    }

    const result = Object.values(map).map((w) => ({
      waiterId: w.waiterId,
      waiterName: w.waiterName,
      tablesCount: w.tables.size,
      totalOrders: w.totalOrders,
      totalRevenue: Math.round(w.totalRevenue * 100) / 100,
      averageTicket:
        w.totalOrders > 0
          ? Math.round((w.totalRevenue / w.totalOrders) * 100) / 100
          : 0,
    }));

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function buildRange(period, dateStr) {
  const base = dateStr ? new Date(dateStr + "T00:00:00-03:00") : new Date();

  let start, end;

  if (period === "week") {
    // start of week (Sunday)
    start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else if (period === "month") {
    start = new Date(base.getFullYear(), base.getMonth(), 1);
    end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  } else {
    // day
    start = new Date(base);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 1);
  }

  return { start, end };
}

export { financeSummary, financeWaiters };
