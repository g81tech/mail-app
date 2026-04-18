export interface Account {
  id: number;
  name: string;        // Username/Email
  type: "individual";
  description: string;
  quota: number;       // In bytes
  usedQuota: number;   // In bytes
  emails: string[];
  roles: Role[];
  locale: string;
  status: "active" | "suspended" | string;
  recovery_email?: string;
}

export interface Role {
  key: string;
  label: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface CreateAccountPayload {
  name: string;
  password?: string;
  description: string;
  quota: number;
  emails: string[];
  recovery_email?: string;
  status?: string;
  roles?: string[];
}

export interface UpdateAccountPayload {
  description?: string;
  quota?: number;
  emails?: string[];
  password?: string;
  status?: "active" | "suspended" | string;
  recovery_email?: string;
  name?: string;
  roles?: string[];
}
