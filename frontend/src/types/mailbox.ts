export interface MailboxEmail {
  id: string;
  from_name: string | null;
  from_addr: string | null;
  subject: string;
  snippet: string;
  date: string | null;
  is_read: boolean;
}

export interface MailboxEmailList {
  items: MailboxEmail[];
  total: number;
  unread_count: number;
}

export interface MailboxEmailDetail {
  id: string;
  from_name: string | null;
  from_addr: string | null;
  to_addr: string | null;
  subject: string;
  date: string | null;
  body_text: string | null;
  body_html: string | null;
  is_read: boolean;
}

export interface MailboxSendInput {
  to: string;
  subject: string;
  body: string;
}

export interface MailboxSendResult {
  ok: boolean;
  message: string;
}
