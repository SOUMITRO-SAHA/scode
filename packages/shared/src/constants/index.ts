export {
  DEFAULT_PORT,
  SERVER_HOST,
  serverBase,
  apiV1Base,
  healthUrl,
  processUrl,
  v1HealthUrl,
  v1ChatUrl,
  v1ProcessUrl,
  v1ProvidersUrl,
  v1ProviderUrl,
  v1ProviderDefaultUrl,
  v1ModelsUrl,
  v1ModelDefaultUrl,
  v1SessionsUrl,
  v1SessionUrl,
  v1SessionMessagesUrl,
  v1SkillsUrl,
  v1SkillUrl,
  v1SkillsReloadUrl,
  v1SkillsValidateUrl,
  v1ConfigUrl,
  v1LogsUrl,
  v1StatsUrl,
} from "./endpoints";

export {
  SCODE_DIR,
  scodePath,
  SCODE_CONFIG_PATH,
  SCODE_AUTH_PATH,
  SCODE_DB_PATH,
  SCODE_LOGS_DIR,
} from "./paths";

export { PROVIDER_ENV_MAP } from "./providers";

export { DEFAULT_MODEL_STRING, DEFAULT_APP_CONFIG } from "./defaults";

export const POLL_INTERVAL = 200;
export const MAX_POLLS = 25;
