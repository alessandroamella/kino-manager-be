export const itemSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  category: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
};
