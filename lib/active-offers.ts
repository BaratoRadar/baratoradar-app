export function activeOfferSince() {
  const since = new Date();
  since.setHours(since.getHours() - 24);

  return since;
}

export function activeOfferWhere() {
  return {
    available: true,
    updatedAt: {
      gte: activeOfferSince(),
    },
  };
}