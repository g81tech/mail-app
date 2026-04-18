import { Account, ListResponse, CreateAccountPayload, UpdateAccountPayload, Role } from "../entities/account";

export interface IAccountRepository {
  listAccounts(page: number, limit: number): Promise<ListResponse<Account>>;
  getAccountById(id: number): Promise<Account>;
  createAccount(payload: CreateAccountPayload): Promise<Account>;
  updateAccount(id: number, payload: UpdateAccountPayload): Promise<Account>;
  deleteAccount(id: number): Promise<void>;
  getUserAccount(): Promise<Account>;
  updateUserAccount(payload: UpdateAccountPayload): Promise<Account>;
  getRoles(): Promise<Role[]>;
  resetPassword(id: number): Promise<void>;
}
