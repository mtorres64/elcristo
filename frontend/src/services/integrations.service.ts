import { api } from "./api";
import type {
  EmailIntegration,
  EmailIntegrationInput,
  GetnetEnvironment,
  GetnetIntegration,
  GetnetIntegrationInput,
  GetnetPublicConfig,
  GetnetTestConnectionResult,
  IntegrationTestResult,
} from "../types/integration";

export const integrationsService = {
  async getGetnet(): Promise<GetnetIntegration> {
    const res = await api.get("/integrations/getnet");
    return res.data;
  },

  async updateGetnet(data: GetnetIntegrationInput): Promise<GetnetIntegration> {
    const res = await api.put("/integrations/getnet", data);
    return res.data;
  },

  async testGetnetConnection(environment: GetnetEnvironment): Promise<GetnetTestConnectionResult> {
    const res = await api.post("/integrations/getnet/test-connection", null, { params: { environment } });
    return res.data;
  },

  // Sin auth: la usa el checkout público para saber si mostrar el formulario de Getnet.
  async getGetnetPublicConfig(): Promise<GetnetPublicConfig> {
    const res = await api.get("/integrations/getnet/public-config");
    return res.data;
  },

  async getEmail(): Promise<EmailIntegration> {
    const res = await api.get("/integrations/email");
    return res.data;
  },

  async updateEmail(data: EmailIntegrationInput): Promise<EmailIntegration> {
    const res = await api.put("/integrations/email", data);
    return res.data;
  },

  async testEmailConnection(to: string): Promise<IntegrationTestResult> {
    const res = await api.post("/integrations/email/test", { to });
    return res.data;
  },
};
