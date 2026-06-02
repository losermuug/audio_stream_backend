function getPagination(query) {
  const page = Math.max(Number.parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function pagedResponse(items, page, limit, total) {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getPagination,
  pagedResponse,
};
