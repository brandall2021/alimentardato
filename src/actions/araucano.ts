'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

const CAMPOS_ESPERADOS = 28

function parseDateAAAAMMDD(val: string): Date | null {
  val = val.trim()
  if (!val || val.length !== 8) return null
  const m = val.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3])
  return isNaN(d.getTime()) ? null : d
}

function limpiarString(val: string): string {
  return val.trim()
}

function parseNumero(val: string): number | null {
  const s = val.trim()
  if (!s) return null
  const n = Number(s)
  return isNaN(n) ? null : n
}

function parseSN(val: string): string {
  const s = val.trim().toUpperCase()
  return s === 'S' ? 'S' : 'N'
}

export interface LineaParseada {
  fila: number
  valida: boolean
  error?: string
  datos?: {
    apellido: string
    nombres: string
    codigoTipoDocumento: number
    numeroDocumento: string
    cuil: string
    genero: number
    fechaNacimiento: Date
    cueEscuelaOrigen: string
    codigoHorasTrabajo: string
    nivelInstruccionPadre: number
    nivelInstruccionMadre: number
    paisNacimiento: number
    paisDomicilioProcedencia: number
    fechaIngresoPais: Date | null
    paisExpedidorTitulo: number
    localidadProcedencia: number | null
    identidadGenero: number
    identidadGeneroTexto: string | null
    puebloOriginario: number | null
    puebloOriginarioTexto: string | null
    condicionDiscapacidad: string
    tieneCUD: string
    discapacidadAuditiva: string
    discapacidadVisual: string
    discapacidadMotora: string
    discapacidadPsicosocial: string
    otraSituacionDiscapacidad: string
    descripcionOtraDiscapacidad: string | null
  }
}

export async function parsearArchivoTxt(base64: string): Promise<{
  lineas: LineaParseada[]
  total: number
  validas: number
  errores: number
}> {
  await requireAdmin()

  const buf = Buffer.from(base64, 'base64')
  const contenido = buf.toString('utf-8')
  const lineasRaw = contenido.split(/\r?\n/).filter((l) => l.trim())

  const lineas: LineaParseada[] = []
  let validas = 0
  let errores = 0

  for (let i = 0; i < lineasRaw.length; i++) {
    const fila = i + 1
    const raw = lineasRaw[i].trim()
    if (!raw) continue

    let partes = raw.split('|')

    // trailing | → descartar último elemento vacío
    if (partes.length === CAMPOS_ESPERADOS + 1 && partes[partes.length - 1] === '') {
      partes = partes.slice(0, CAMPOS_ESPERADOS)
    }

    if (partes.length !== CAMPOS_ESPERADOS) {
      lineas.push({
        fila,
        valida: false,
        error: `Se esperaban ${CAMPOS_ESPERADOS} campos, se obtuvieron ${partes.length}`,
      })
      errores++
      continue
    }

    try {
      const [
        apellido, nombres, codTipoDoc, numDoc, cuil, genero, fechaNac,
        cueEscuela, codHoras, nivPadre, nivMadre, paisNac, paisDomic,
        fechaIngPais, paisExpTit, locProc, idGenero, idGeneroText,
        pueblOri, pueblOriText, condDisc, tieneCUD, discAud, discVis,
        discMot, discPsic, otraDisc, descOtraDisc,
      ] = partes.map(limpiarString)

      if (!apellido) {
        lineas.push({ fila, valida: false, error: 'Apellido del Estudiante es obligatorio' })
        errores++
        continue
      }

      if (!nombres || nombres.length < 2) {
        lineas.push({ fila, valida: false, error: 'Nombres del Estudiante es obligatorio (mín. 2 caracteres)' })
        errores++
        continue
      }

      if (!numDoc || numDoc.length < 4 || numDoc.length > 30) {
        lineas.push({ fila, valida: false, error: 'Número Documento debe tener entre 4 y 30 caracteres' })
        errores++
        continue
      }

      if (!cuil || cuil.length !== 11) {
        lineas.push({ fila, valida: false, error: 'CUIT/CUIL debe tener 11 dígitos' })
        errores++
        continue
      }

      const fechaNacDate = parseDateAAAAMMDD(fechaNac)
      if (!fechaNacDate) {
        lineas.push({ fila, valida: false, error: 'Fecha de Nacimiento inválida (formato AAAAMMDD)' })
        errores++
        continue
      }

      const codTipoDocNum = parseNumero(codTipoDoc)
      if (codTipoDocNum === null) {
        lineas.push({ fila, valida: false, error: 'Código Tipo Documento inválido' })
        errores++
        continue
      }

      const generoNum = parseNumero(genero)
      if (generoNum === null) {
        lineas.push({ fila, valida: false, error: 'Género inválido' })
        errores++
        continue
      }

      const paisNacNum = parseNumero(paisNac)
      if (paisNacNum === null) {
        lineas.push({ fila, valida: false, error: 'País Nacimiento inválido' })
        errores++
        continue
      }

      const paisDomicNum = parseNumero(paisDomic)
      if (paisDomicNum === null) {
        lineas.push({ fila, valida: false, error: 'País Domicilio Procedencia inválido' })
        errores++
        continue
      }

      const paisExpTitNum = parseNumero(paisExpTit)
      if (paisExpTitNum === null) {
        lineas.push({ fila, valida: false, error: 'País que expide el Título inválido' })
        errores++
        continue
      }

      const idGeneroNum = parseNumero(idGenero)
      if (idGeneroNum === null) {
        lineas.push({ fila, valida: false, error: 'Identidad de Género inválida' })
        errores++
        continue
      }

      lineas.push({
        fila,
        valida: true,
        datos: {
          apellido,
          nombres,
          codigoTipoDocumento: codTipoDocNum,
          numeroDocumento: numDoc,
          cuil,
          genero: generoNum,
          fechaNacimiento: fechaNacDate,
          cueEscuelaOrigen: cueEscuela,
          codigoHorasTrabajo: codHoras,
          nivelInstruccionPadre: parseNumero(nivPadre) ?? 0,
          nivelInstruccionMadre: parseNumero(nivMadre) ?? 0,
          paisNacimiento: paisNacNum,
          paisDomicilioProcedencia: paisDomicNum,
          fechaIngresoPais: fechaIngPais ? parseDateAAAAMMDD(fechaIngPais) : null,
          paisExpedidorTitulo: paisExpTitNum,
          localidadProcedencia: parseNumero(locProc),
          identidadGenero: idGeneroNum,
          identidadGeneroTexto: idGeneroText || null,
          puebloOriginario: parseNumero(pueblOri),
          puebloOriginarioTexto: pueblOriText || null,
          condicionDiscapacidad: parseSN(condDisc),
          tieneCUD: parseSN(tieneCUD),
          discapacidadAuditiva: parseSN(discAud),
          discapacidadVisual: parseSN(discVis),
          discapacidadMotora: parseSN(discMot),
          discapacidadPsicosocial: parseSN(discPsic),
          otraSituacionDiscapacidad: parseSN(otraDisc),
          descripcionOtraDiscapacidad: descOtraDisc || null,
        },
      })
      validas++
    } catch {
      lineas.push({ fila, valida: false, error: 'Error al procesar la línea' })
      errores++
    }
  }

  return { lineas, total: lineas.length, validas, errores }
}

export async function importarAraucano(
  base64: string,
  importarSoloValidas: boolean = true,
  camposSeleccionados?: Set<string>
): Promise<{
  importados: number
  errores: number
  detalles: { fila: number; exito: boolean; error?: string }[]
  importacionId?: string
}> {
  await requireAdmin()

  const { lineas } = await parsearArchivoTxt(base64)

  const aImportar = importarSoloValidas
    ? lineas.filter((l) => l.valida)
    : lineas

  if (aImportar.length === 0) {
    return { importados: 0, errores: 0, detalles: [] }
  }

  const importacion = await prisma.araucanoImportacion.create({
    data: {
      filename: `araucano_${new Date().toISOString().slice(0, 10)}.txt`,
      filas: aImportar.length,
    },
  })

  const CAMPOS_FIJOS = new Set(['apellido', 'nombres', 'numeroDocumento'])

  const detalles: { fila: number; exito: boolean; error?: string }[] = []
  let ok = 0
  let err = 0

  for (const linea of aImportar) {
    if (!linea.valida || !linea.datos) {
      detalles.push({ fila: linea.fila, exito: false, error: linea.error })
      err++
      continue
    }

    try {
      const data: Record<string, unknown> = {
        importacionId: importacion.id,
      }
      for (const [key, val] of Object.entries(linea.datos)) {
        if (!camposSeleccionados || camposSeleccionados.has(key) || CAMPOS_FIJOS.has(key)) {
          data[key] = val
        }
      }
      await prisma.araucanoRegistro.create({ data: data as never })
      detalles.push({ fila: linea.fila, exito: true })
      ok++
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      detalles.push({ fila: linea.fila, exito: false, error: msg })
      err++
    }
  }

  await prisma.araucanoImportacion.update({
    where: { id: importacion.id },
    data: { importados: ok, errores: err },
  })

  revalidatePath('/admin/araucano')

  return { importados: ok, errores: err, detalles, importacionId: importacion.id }
}

export async function vaciarAraucano(): Promise<{ eliminados: number }> {
  await requireAdmin()

  const eliminados = await prisma.araucanoRegistro.count()
  await prisma.araucanoRegistro.deleteMany()
  await prisma.araucanoImportacion.deleteMany()

  revalidatePath('/admin/araucano')

  return { eliminados }
}
