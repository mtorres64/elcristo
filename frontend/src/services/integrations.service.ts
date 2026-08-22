import { api } from "./api";
import type {
  GetnetEnvironment,
  GetnetIntegration,
  GetnetIntegrationInput,
  GetnetPublicConfig,
  GetnetTestConnectionResult,
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
};
