import { IAccountRepository } from "../../domain/repositories/account.repository";
import { Account, ListResponse, CreateAccountPayload, UpdateAccountPayload, Role } from "../../domain/entities/account";
import { ApiResponse } from "../../domain/entities/auth";
import apiClient from "../sources/api.client";

export class AccountRepositoryImpl implements IAccountRepository {
  private mapAccount(data: any): Account {
    return {
      ...data,
      quota: Number(data.quota || 0),
      usedQuota: Number(data.usedQuota || 0),
      roles: Array.isArray(data.roles) 
        ? data.roles.map((role: any) => {
            if (typeof role === "string") {
              return {
                key: role,
                label: role.charAt(0).toUpperCase() + role.slice(1)
              };
            }
            return role as Role;
          })
        : []
    };
  }

  async listAccounts(page: number, limit: number): Promise<ListResponse<Account>> {
    const response = await apiClient.get<any, ApiResponse<ListResponse<Account>>>(`/admin/accounts?page=${page}&limit=${limit}`);
    if (response.error) throw new Error(response.error);
    
    return {
      items: response.data.items.map(acc => this.mapAccount(acc)),
      total: response.data.total
    };
  }

  async getAccountById(id: number): Promise<Account> {
    const response = await apiClient.get<any, ApiResponse<Account>>(`/admin/accounts/${id}`);
    if (response.error) throw new Error(response.error);
    return this.mapAccount(response.data);
  }

  async createAccount(payload: CreateAccountPayload): Promise<Account> {
    const response = await apiClient.post<any, ApiResponse<Account>>("/admin/accounts", payload);
    if (response.error) throw new Error(response.error);
    return this.mapAccount(response.data);
  }

  async updateAccount(id: number, payload: UpdateAccountPayload): Promise<Account> {
    const response = await apiClient.patch<any, ApiResponse<Account>>(`/admin/accounts/${id}`, payload);
    if (response.error) throw new Error(response.error);
    return this.mapAccount(response.data);
  }

  async deleteAccount(id: number): Promise<void> {
    const response = await apiClient.delete<any, ApiResponse<void>>(`/admin/accounts/${id}`);
    if (response.error) throw new Error(response.error);
  }

  async getUserAccount(): Promise<Account> {
    const response = await apiClient.get<any, ApiResponse<Account>>("/user/account");
    if (response.error) throw new Error(response.error);
    return this.mapAccount(response.data);
  }

  async updateUserAccount(payload: UpdateAccountPayload): Promise<Account> {
    const response = await apiClient.patch<any, ApiResponse<Account>>("/user/account", payload);
    if (response.error) throw new Error(response.error);
    return this.mapAccount(response.data);
  }

  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<any, ApiResponse<Role[] | string[]>>("/admin/roles");
    if (response.error) throw new Error(response.error);
    
    // If the API returns strings, map them to Role objects
    if (Array.isArray(response.data) && typeof response.data[0] === "string") {
      return (response.data as string[]).map(role => ({
        key: role,
        label: role.charAt(0).toUpperCase() + role.slice(1)
      }));
    }
    
    return response.data as Role[];
  }

  async resetPassword(id: number): Promise<void> {
    const response = await apiClient.post<any, ApiResponse<void>>(`/admin/accounts/${id}/reset-password`, {});
    if (response.error) throw new Error(response.error);
  }
}
