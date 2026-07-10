import {
  AuthError,
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from '@supabase/supabase-js'
import { useToastStore } from '@/stores/toast'

export interface AppError {
  /** Mensaje claro para el usuario, en español. */
  message: string
  /** Código técnico (SQLSTATE, HTTP_xxx, auth_xxx…) para depurar. */
  code: string
  /** Detalle técnico para los logs (no se muestra al usuario). */
  technical: string
}

/** SQLSTATE / PostgREST → mensaje claro. */
const PG_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos.',
  '23502': 'Falta completar un campo obligatorio.',
  '23503': 'No se puede porque el registro está relacionado con otros datos.',
  '23514': 'Algún valor está fuera de rango (revisa cantidades o la nota, debe ser 1 a 5).',
  '22P02': 'Un valor tiene un formato inválido.',
  '42501': 'No tienes permiso para realizar esta acción.',
  PGRST116: 'No se encontró el registro solicitado.',
  PGRST301: 'Tu sesión expiró. Vuelve a entrar.',
}

const AUTH_MESSAGES: Record<string, string> = {
  anonymous_provider_disabled: 'El acceso anónimo está desactivado en el servidor.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  session_not_found: 'Tu sesión expiró. Vuelve a entrar.',
}

function httpFallback(status: number): string {
  if (status === 400) return 'La solicitud no es válida.'
  if (status === 401 || status === 403) return 'No tienes permiso para esta acción.'
  if (status === 404) return 'No se encontró el recurso.'
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento.'
  if (status >= 500) return 'El servicio tuvo un problema. Intenta de nuevo en un momento.'
  return 'No se pudo completar la operación.'
}

function isPostgrestError(
  err: unknown,
): err is { code: string; message: string; details: string | null; hint: string | null } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'details' in err &&
    'hint' in err &&
    'message' in err
  )
}

/** Convierte cualquier error en una forma estándar, clara y con detalle técnico. */
export async function normalizeError(err: unknown): Promise<AppError> {
  // Sin conexión
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      message: 'Parece que no tienes conexión a internet.',
      code: 'offline',
      technical: 'navigator.onLine === false',
    }
  }

  // Edge Function devolvió un status no-2xx → leemos su body estructurado
  if (err instanceof FunctionsHttpError) {
    const status = err.context?.status ?? 0
    let body: unknown = null
    try {
      body = await err.context.clone().json()
    } catch {
      /* el body no era JSON */
    }
    const serverMessage =
      typeof body === 'object' && body !== null && 'error' in body
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (body as any).error?.message ?? (body as any).error
        : undefined
    return {
      message: typeof serverMessage === 'string' ? serverMessage : httpFallback(status),
      code: `HTTP_${status}`,
      technical: body ? JSON.stringify(body) : err.message,
    }
  }
  if (err instanceof FunctionsRelayError || err instanceof FunctionsFetchError) {
    return {
      message: 'No se pudo contactar el servicio. Revisa tu conexión e intenta de nuevo.',
      code: 'function_unreachable',
      technical: err.message,
    }
  }

  // Auth (GoTrue)
  if (err instanceof AuthError) {
    const code = err.code ?? `auth_${err.status ?? 0}`
    return {
      message: (err.code && AUTH_MESSAGES[err.code]) || err.message || httpFallback(err.status ?? 0),
      code,
      technical: `${err.name}: ${err.message}`,
    }
  }

  // PostgREST / base de datos
  if (isPostgrestError(err)) {
    return {
      message: PG_MESSAGES[err.code] ?? 'No se pudo completar la operación.',
      code: err.code || 'postgrest',
      technical: [err.message, err.details, err.hint].filter(Boolean).join(' · '),
    }
  }

  if (err instanceof Error) {
    return { message: err.message || 'Ocurrió un error inesperado.', code: err.name || 'error', technical: err.stack ?? err.message }
  }

  return { message: 'Ocurrió un error inesperado.', code: 'unknown', technical: String(err) }
}

/** Loggea el error de forma estructurada (consola/Network) y devuelve la forma normalizada. */
export async function logError(err: unknown, context: string): Promise<AppError> {
  const e = await normalizeError(err)
  console.error(
    `%c[CocinaMano] ${context} → ${e.code}`,
    'color:#b03a2e;font-weight:600',
    { mensaje: e.message, detalle: e.technical, original: err },
  )
  return e
}

/** Igual que logError pero además muestra un toast claro al usuario. */
export async function reportError(err: unknown, context: string): Promise<AppError> {
  const e = await logError(err, context)
  useToastStore().error(e.message)
  return e
}
