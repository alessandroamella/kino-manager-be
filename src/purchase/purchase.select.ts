export const purchaseSelect = {
  id: true,
  purchaseDate: true,
  createdAt: true,
  updatedAt: true,
  purchasedItems: {
    select: {
      itemId: true,
      quantity: true,
      purchaseId: true,
    },
  },
  discount: true,
  paymentMethod: true,
  total: true,
};
