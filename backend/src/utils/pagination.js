// Normalizes page/limit query params and returns both the pagination meta
// and a slice helper for an in-memory array (repositories use this now;
// a MySQL version would translate this into LIMIT/OFFSET instead).
function getPagination(query, { defaultLimit = 12, maxLimit = 100 } = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginate(items, { page, limit, offset }) {
  const total = items.length;
  const data = items.slice(offset, offset + limit);
  return {
    items: data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: offset + limit < total,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = { getPagination, paginate };
