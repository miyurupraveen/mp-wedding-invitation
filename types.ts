export interface Invitee {
  id: string;
  slug: string; // URL-friendly identifier based on name
  name: string;
  title?: string; // e.g. Mr, Mrs, Ven, Family
  message?: string;
  viewed: boolean;
}

export interface WeddingSettings {
  inviteImage: string | null; // Base64 string of the uploaded image
  coupleName: string;
  weddingDate: string;
}

export interface WeddingContextType {
  settings: WeddingSettings;
  invitees: Invitee[];
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  updateSettings: (newSettings: Partial<WeddingSettings>) => void;
  addInvitee: (name: string, title: string) => Promise<void> | void;
  updateInvitee: (id: string, data: Partial<Invitee>) => void;
  deleteInvitee: (id: string) => void;
  getInvitee: (identifier: string) => Invitee | undefined;
}