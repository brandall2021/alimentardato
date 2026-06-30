import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const alumnos = [
  {
    apellidoNombre: 'García López, Juan',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '35000123',
    fechaNacimiento: new Date('1998-03-15'),
    email: 'juan.garcia@example.com',
    telefono: '3815550101',
    legajo: '1001',
    plan: 'Contador Público',
    anoIngreso: 2020,
    fechaIngreso: new Date('2020-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'Martínez Ruiz, María',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '36000234',
    fechaNacimiento: new Date('1999-07-22'),
    email: 'maria.martinez@example.com',
    telefono: '3815550102',
    legajo: '1002',
    plan: 'Licenciatura en Administración',
    anoIngreso: 2021,
    fechaIngreso: new Date('2021-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'López Fernández, Carlos',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '37000345',
    fechaNacimiento: new Date('2000-11-05'),
    email: 'carlos.lopez@example.com',
    telefono: '3815550103',
    legajo: '1003',
    plan: 'Contador Público',
    anoIngreso: 2022,
    fechaIngreso: new Date('2022-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'González Pereyra, Ana',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '34000456',
    fechaNacimiento: new Date('1997-01-30'),
    email: 'ana.gonzalez@example.com',
    telefono: '3815550104',
    legajo: '1004',
    plan: 'Licenciatura en Economía',
    anoIngreso: 2019,
    fechaIngreso: new Date('2019-03-01'),
    estadoInscripcion: 'Egresado',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'Rodríguez Castro, Pedro',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '38000567',
    fechaNacimiento: new Date('2001-09-18'),
    email: 'pedro.rodriguez@example.com',
    telefono: '3815550105',
    legajo: '1005',
    plan: 'Contador Público',
    anoIngreso: 2023,
    fechaIngreso: new Date('2023-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'Fernández Díaz, Laura',
    tipoDocumento: 'LE' as const,
    numeroDocumento: 'LE123456',
    fechaNacimiento: new Date('1996-05-12'),
    email: 'laura.fernandez@example.com',
    telefono: '3815550106',
    legajo: '1006',
    plan: 'Licenciatura en Administración',
    anoIngreso: 2018,
    fechaIngreso: new Date('2018-03-01'),
    estadoInscripcion: 'Egresado',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'Díaz Molina, Roberto',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '39000678',
    fechaNacimiento: new Date('2002-12-25'),
    email: 'roberto.diaz@example.com',
    telefono: '3815550107',
    legajo: null,
    plan: 'Licenciatura en Economía',
    anoIngreso: 2024,
    fechaIngreso: new Date('2024-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Perú',
  },
  {
    apellidoNombre: 'Pereyra Sosa, Sofía',
    tipoDocumento: 'PASAPORTE' as const,
    numeroDocumento: 'AA123456',
    fechaNacimiento: new Date('1999-04-08'),
    email: 'sofia.pereyra@example.com',
    telefono: '3815550108',
    legajo: '1008',
    plan: 'Contador Público',
    anoIngreso: 2021,
    fechaIngreso: new Date('2021-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Bolivia',
  },
  {
    apellidoNombre: 'Castillo Vargas, Diego',
    tipoDocumento: 'DNI' as const,
    numeroDocumento: '41000789',
    fechaNacimiento: new Date('2000-08-14'),
    email: null,
    telefono: '3815550109',
    legajo: '1009',
    plan: 'Licenciatura en Administración',
    anoIngreso: 2022,
    fechaIngreso: new Date('2022-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Argentina',
  },
  {
    apellidoNombre: 'Molina Acosta, Florencia',
    tipoDocumento: 'LC' as const,
    numeroDocumento: 'LC987654',
    fechaNacimiento: new Date('1997-06-20'),
    email: 'florencia.molina@example.com',
    telefono: null,
    legajo: '1010',
    plan: 'Contador Público',
    anoIngreso: 2020,
    fechaIngreso: new Date('2020-03-01'),
    estadoInscripcion: 'Regular',
    paisOrigen: 'Argentina',
  },
]

async function main() {
  console.log('Insertando datos de ejemplo...')

  for (const a of alumnos) {
    await prisma.alumno.upsert({
      where: {
        tipoDocumento_numeroDocumento: {
          tipoDocumento: a.tipoDocumento,
          numeroDocumento: a.numeroDocumento,
        },
      },
      create: a,
      update: a,
    })
  }

  console.log(`${alumnos.length} alumnos insertados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
