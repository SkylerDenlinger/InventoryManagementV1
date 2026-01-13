export type Location = {
  id: number;
  name: string;
  code: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  isActive: boolean;
};