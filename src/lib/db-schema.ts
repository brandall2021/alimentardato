import { prisma } from './prisma'

type Row = Record<string, unknown>

export async function getDatabaseSchema(): Promise<string> {
  const tables = await prisma.$queryRaw<Row[]>`
    SELECT
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `

  const primaryKeys = await prisma.$queryRaw<Row[]>`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position
  `

  const foreignKeys = await prisma.$queryRaw<Row[]>`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position
  `

  const enumTypes = await prisma.$queryRaw<Row[]>`
    SELECT
      t.typname AS enum_name,
      e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    ORDER BY t.typname, e.enumsortorder
  `

  const pkMap = new Map<string, string[]>()
  for (const row of primaryKeys) {
    const table = row.table_name as string
    if (!pkMap.has(table)) pkMap.set(table, [])
    pkMap.get(table)!.push(row.column_name as string)
  }

  const fkMap = new Map<string, { column: string; refTable: string; refColumn: string }[]>()
  for (const row of foreignKeys) {
    const table = row.table_name as string
    if (!fkMap.has(table)) fkMap.set(table, [])
    fkMap.get(table)!.push({
      column: row.column_name as string,
      refTable: row.foreign_table_name as string,
      refColumn: row.foreign_column_name as string,
    })
  }

  const enumMap = new Map<string, string[]>()
  for (const row of enumTypes) {
    const name = row.enum_name as string
    if (!enumMap.has(name)) enumMap.set(name, [])
    enumMap.get(name)!.push(row.enum_value as string)
  }

  const tableMap = new Map<string, Row[]>()
  for (const row of tables) {
    const table = row.table_name as string
    if (!tableMap.has(table)) tableMap.set(table, [])
    tableMap.get(table)!.push(row)
  }

  const lines: string[] = []
  for (const [tableName, cols] of tableMap) {
    lines.push(`TABLE: ${tableName}`)

    const pks = pkMap.get(tableName) ?? []
    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY: ${pks.join(', ')}`)
    }

    const fks = fkMap.get(tableName) ?? []
    if (fks.length > 0) {
      for (const fk of fks) {
        lines.push(`  FOREIGN KEY: ${fk.column} -> ${fk.refTable}(${fk.refColumn})`)
      }
    }

    for (const col of cols) {
      const name = col.column_name as string
      const type = col.data_type as string
      const nullable = col.is_nullable === 'YES' ? ', nullable' : ', NOT NULL'
      const maxLen = col.character_maximum_length
        ? `(${col.character_maximum_length})`
        : ''
      lines.push(`  - ${name}: ${type}${maxLen}${nullable}`)
    }

    lines.push('')
  }

  if (enumMap.size > 0) {
    lines.push('ENUMS:')
    for (const [name, values] of enumMap) {
      lines.push(`  ${name}: ${values.join(' | ')}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

let cachedSchema: string | null = null

export async function getCachedSchema(): Promise<string> {
  if (cachedSchema) return cachedSchema
  cachedSchema = await getDatabaseSchema()
  return cachedSchema
}

export type TableInfo = {
  name: string
  columns: { name: string; type: string; nullable: boolean; isPk: boolean }[]
  rowCount: number
}

export async function getTablesList(): Promise<TableInfo[]> {
  const cols = await prisma.$queryRaw<Row[]>`
    SELECT
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.ordinal_position
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `

  const pkRows = await prisma.$queryRaw<Row[]>`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `

  const pkSet = new Set<string>()
  for (const row of pkRows) {
    pkSet.add(`${row.table_name}.${row.column_name}`)
  }

  const countRows = await prisma.$queryRaw<Row[]>`
    SELECT relname AS table_name, n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY relname
  `
  const countMap = new Map<string, number>()
  for (const row of countRows) {
    countMap.set(row.table_name as string, Number(row.row_count))
  }

  const tableMap = new Map<string, TableInfo>()
  for (const row of cols) {
    const table = row.table_name as string
    if (!tableMap.has(table)) {
      tableMap.set(table, { name: table, columns: [], rowCount: countMap.get(table) ?? 0 })
    }
    tableMap.get(table)!.columns.push({
      name: row.column_name as string,
      type: row.data_type as string,
      nullable: row.is_nullable === 'YES',
      isPk: pkSet.has(`${table}.${row.column_name}`),
    })
  }

  return Array.from(tableMap.values())
}
