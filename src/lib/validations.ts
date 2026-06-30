import { z } from 'zod/v4'

const MAX_BASE64 = 10 * 1024 * 1024
const MAX_FILAS_IMPORTACION = 5000
const MAX_VALORES_BUSQUEDA = 500
const MAX_PAGINA = 1000
const MAX_POR_PAGINA = 200

export const buscarValoresSchema = z.string().min(1).max(MAX_VALORES_BUSQUEDA * 50)

export const filtrosSchema = z.object({
  plan: z.string().max(100).optional(),
  anoIngreso: z.number().int().min(1900).max(2100).optional(),
  estadoInscripcion: z.string().max(100).optional(),
})

export const actualizarContactoSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().max(254).nullable().optional(),
  telefono: z.string().max(50).nullable().optional(),
})

export const importarExcelSchema = z.string().min(1).max(MAX_BASE64).refine(
  (val) => {
    const size = Buffer.from(val, 'base64').length
    return size <= MAX_BASE64
  },
  { message: 'El archivo excede el tamaño máximo' }
)

export const paginacionSchema = z.object({
  pagina: z.number().int().min(1).max(MAX_PAGINA).default(1),
  porPagina: z.number().int().min(1).max(MAX_POR_PAGINA).default(50),
})

export function validarImportacionRows(cantidad: number) {
  if (cantidad > MAX_FILAS_IMPORTACION) {
    throw new Error(`Máximo ${MAX_FILAS_IMPORTACION} filas por importación`)
  }
}
