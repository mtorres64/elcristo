import { api } from "./api";
import type {
  MailboxEmailDetail,
  MailboxEmailList,
  MailboxFolder,
  MailboxSendInput,
  MailboxSendResult,
} from "../types/mailbox";

export const mailboxService = {
  async list(folder: MailboxFolder = "inbox", page = 1, pageSize = 20): Promise<MailboxEmailList> {
    const res = await api.get("/mailbox/emails", { params: { folder, page, page_size: pageSize } });
    return res.data;
  },

  async get(id: string): Promise<MailboxEmailDetail> {
    const res = await api.get(`/mailbox/emails/${id}`);
    return res.data;
  },

  async unreadCount(): Promise<number> {
    const res = await api.get("/mailbox/unread-count");
    return res.data.count;
  },

  async send(data: MailboxSendInput): Promise<MailboxSendResult> {
    const res = await api.post("/mailbox/send", data);
    return res.data;
  },
};
