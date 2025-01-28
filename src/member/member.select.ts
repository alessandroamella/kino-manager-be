export const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  password: false,
  codiceFiscale: true,
  birthDate: true,
  birthComune: true,
  birthProvince: true,
  birthCountry: true,
  phoneNumber: true,
  address: true,
  gender: true,
  membershipCardNumber: true,
  memberSince: true,
  signatureR2Key: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const memberSelectExtended = {
  ...memberSelect,
  streetName: true,
  streetNumber: true,
  postalCode: true,
  city: true,
  province: true,
  country: true,
};
