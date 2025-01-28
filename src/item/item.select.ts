export const itemSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  category: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  },
};
