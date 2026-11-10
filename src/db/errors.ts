export type DbErrorCode =
  | 'INVALID_NAME'
  | 'INVALID_COLOR'
  | 'INVALID_PRICE'
  | 'INVALID_QUANTITY'
  | 'INVALID_UNIT'
  | 'INVALID_DATE'
  | 'PARENT_TAG_REQUIRED'
  | 'NOT_A_PARENT_TAG'
  | 'NOT_A_SITE_TAG'
  | 'NOT_FOUND'
  | 'PROTECTED_TAG'
  | 'DUPLICATE_ITEM';

const DEFAULT_MESSAGES: Record<DbErrorCode, string> = {
  INVALID_NAME: 'El nombre no es válido',
  INVALID_COLOR: 'El color debe tener el formato #RRGGBB',
  INVALID_PRICE: 'El precio debe ser un número entero de pesos, mayor o igual a 1',
  INVALID_QUANTITY: 'La cantidad debe ser un número mayor que 0',
  INVALID_UNIT: 'La unidad no es válida',
  INVALID_DATE: 'La fecha debe tener el formato AAAA-MM-DD y existir en el calendario',
  PARENT_TAG_REQUIRED: 'Toda lista necesita una etiqueta madre',
  NOT_A_PARENT_TAG: 'La etiqueta indicada no es una etiqueta madre',
  NOT_A_SITE_TAG: 'La etiqueta indicada no es una etiqueta de sitio',
  NOT_FOUND: 'No se encontró el registro pedido',
  PROTECTED_TAG: 'Las etiquetas madre no se pueden modificar ni borrar',
  DUPLICATE_ITEM: 'Ya existe un ítem con ese nombre',
};

/**
 * Error de validación o de regla de datos. La interfaz decide qué texto mostrar según el
 * código; el mensaje es solo para registros de depuración.
 */
export class DbValidationError extends Error {
  readonly code: DbErrorCode;

  constructor(code: DbErrorCode, message?: string) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = 'DbValidationError';
    this.code = code;
  }
}
