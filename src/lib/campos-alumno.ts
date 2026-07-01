export type CampoAlumno =
  | 'apellidoNombre'
  | 'tipoDocumento'
  | 'numeroDocumento'
  | 'fechaNacimiento'
  | 'email'
  | 'telefono'
  | 'legajo'
  | 'plan'
  | 'anoIngreso'
  | 'fechaIngreso'
  | 'ultimoExamen'
  | 'ultimaReinscripcion'
  | 'promConAplazos'
  | 'promSinAplazos'
  | 'actividadesAprobadas'
  | 'totalActividades'
  | 'estadoInscripcion'
  | 'paisOrigen'

export const CAMPOS_ALUMNO: { value: CampoAlumno; label: string; required?: boolean }[] = [
  { value: 'apellidoNombre', label: 'Apellido y Nombre', required: true },
  { value: 'tipoDocumento', label: 'Tipo Documento' },
  { value: 'numeroDocumento', label: 'N° Documento', required: true },
  { value: 'fechaNacimiento', label: 'Fecha de Nacimiento' },
  { value: 'email', label: 'Email' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'legajo', label: 'Legajo' },
  { value: 'plan', label: 'Plan' },
  { value: 'anoIngreso', label: 'Año Ingreso' },
  { value: 'fechaIngreso', label: 'Fecha Ingreso' },
  { value: 'ultimoExamen', label: 'Último Examen' },
  { value: 'ultimaReinscripcion', label: 'Última Reinscripción' },
  { value: 'promConAplazos', label: 'Prom. con Aplazos' },
  { value: 'promSinAplazos', label: 'Prom. sin Aplazos' },
  { value: 'actividadesAprobadas', label: 'Actividades Aprobadas' },
  { value: 'totalActividades', label: 'Total Actividades' },
  { value: 'estadoInscripcion', label: 'Estado inscripción' },
  { value: 'paisOrigen', label: 'País de Origen' },
]

export type MapeoColumnas = Record<string, CampoAlumno | ''>
