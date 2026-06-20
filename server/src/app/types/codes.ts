export enum ResponseCodes {
  // =========================
  // 2xx Success
  // =========================

  /** Request completed successfully */
  SUCCESS = 200,

  /** Resource created successfully */
  CREATED = 201,

  /** Request accepted for processing but not completed yet */
  ACCEPTED = 202,

  /** Request succeeded but no content to return */
  NO_CONTENT = 204,

  // =========================
  // 3xx Redirection
  // =========================

  /** Resource has been permanently moved */
  MOVED_PERMANENTLY = 301,

  /** Temporary redirect */
  FOUND = 302,

  /** Client should use cached version */
  NOT_MODIFIED = 304,

  // =========================
  // 4xx Client Errors
  // =========================

  /** Invalid request syntax or validation failed */
  BAD_REQUEST = 400,

  /** Authentication required or failed */
  UNAUTHORIZED = 401,

  /** Authenticated but lacks permission */
  FORBIDDEN = 403,

  /** Requested resource does not exist */
  NOT_FOUND = 404,

  /** HTTP method is not supported */
  METHOD_NOT_ALLOWED = 405,

  /** Resource already exists or duplicate */
  CONFLICT = 409,

  /** Request body too large */
  PAYLOAD_TOO_LARGE = 413,

  /** Unsupported content type */
  UNSUPPORTED_MEDIA_TYPE = 415,

  /** Validation error (invalid fields, schema mismatch) */
  UNPROCESSABLE_ENTITY = 422,

  /** Too many requests (rate limiting) */
  TOO_MANY_REQUESTS = 429,

  // =========================
  // 5xx Server Errors
  // =========================

  /** Unexpected server error */
  INTERNAL_SERVER_ERROR = 500,

  /** Feature not implemented */
  NOT_IMPLEMENTED = 501,

  /** Bad response from upstream service */
  BAD_GATEWAY = 502,

  /** Service temporarily unavailable */
  SERVICE_UNAVAILABLE = 503,

  /** Upstream service timed out */
  GATEWAY_TIMEOUT = 504,
}
