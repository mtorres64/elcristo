import { api } from "./api";
import type { Address, AddressInput } from "../types/address";

export const addressService = {
  async list(): Promise<Address[]> {
    const res = await api.get("/addresses");
    return res.data;
  },

  async create(data: AddressInput): Promise<Address> {
    const res = await api.post("/addresses", data);
    return res.data;
  },

  async update(addressId: string, data: Partial<AddressInput>): Promise<Address> {
    const res = await api.patch(`/addresses/${addressId}`, data);
    return res.data;
  },

  async setDefault(addressId: string): Promise<Address> {
    const res = await api.patch(`/addresses/${addressId}/default`);
    return res.data;
  },

  async remove(addressId: string): Promise<void> {
    await api.delete(`/addresses/${addressId}`);
  },
};
