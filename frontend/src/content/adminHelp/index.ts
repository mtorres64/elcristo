import { matchPath } from "react-router-dom";
import type { HelpTopic, HelpTopicMap } from "./types";
import { dashboardOrdersHelp } from "./dashboardOrders";
import { productsCombosHelp } from "./productsCombos";
import { purchasesCategoriesHelp } from "./purchasesCategories";
import { peopleUsersHelp } from "./peopleUsers";
import { settingsHelp } from "./settingsHelp";
import { otherHelp } from "./otherHelp";

/**
 * Registro completo de ayuda contextual del panel de administración.
 * La clave de cada entrada es el patrón de ruta tal como está declarado en
 * App.tsx (incluyendo los parámetros con ":").
 */
export const ADMIN_HELP_TOPICS: HelpTopicMap = {
  ...dashboardOrdersHelp,
  ...productsCombosHelp,
  ...purchasesCategoriesHelp,
  ...peopleUsersHelp,
  ...settingsHelp,
  ...otherHelp,
};

/**
 * Resuelve el HelpTopic correspondiente a una ruta actual (pathname),
 * contemplando los parámetros dinámicos (p. ej. :productId).
 */
export function getHelpTopic(pathname: string): HelpTopic | undefined {
  for (const pattern of Object.keys(ADMIN_HELP_TOPICS)) {
    if (matchPath({ path: pattern, end: true }, pathname)) {
      return ADMIN_HELP_TOPICS[pattern];
    }
  }
  return undefined;
}
