export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'ORIGIN_NOT_ALLOWED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CAPTURE_ACTIVE'
  | 'CAPTURE_NOT_READY'
  | 'CAPTURE_FAILED'
  | 'CAPTURE_INTERRUPTED'
  | 'CAPTURE_UNAVAILABLE'
  | 'AUDIO_MISSING'
  | 'AUDIO_INVALID'
  | 'AUDIO_DELETE_FAILED'
  | 'AUDIO_CLEANUP_FAILED'
  | 'OPENAI_NOT_CONFIGURED'
  | 'OPENAI_UNAVAILABLE'
  | 'OPENAI_REJECTED'
  | 'TRANSCRIPTION_INVALID'
  | 'SUMMARY_INVALID'
  | 'PROCESSING_FAILED'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(readonly status: number, readonly code: ErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export const errors = {
  invalidRequest: () => new AppError(400, 'INVALID_REQUEST', 'La solicitud no es válida.'),
  origin: () => new AppError(403, 'ORIGIN_NOT_ALLOWED', 'El origen de la solicitud no está permitido.'),
  notFound: (kind = 'El recurso') => new AppError(404, 'NOT_FOUND', `${kind} no existe.`),
  conflict: (code: ErrorCode, message: string) => new AppError(409, code, message),
  unavailable: (code: ErrorCode, message: string) => new AppError(503, code, message),
  internal: () => new AppError(500, 'INTERNAL_ERROR', 'Ocurrió un error local inesperado.'),
}
