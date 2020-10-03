import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function getParent({
    context,
    id,
    type,
}: {
    context: Context
    id: string
    type: string
}): Promise<EntityType | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

    const { rows } = (await client.query(
        sql`
    SELECT p.*
      FROM "`
            .append(table)
            .append(
                sql`" p, "`.append(table).append(sql`" c
     WHERE p.id = c.parent
       AND p.tenant_id = ${tenantID}
       AND c.tenant_id = ${tenantID}
       AND c.entity_type = ${type}
       AND c.id = ${id}
     LIMIT 1
    `)
            )
    )) as {
        rows: Array<{
            id: string
            entity_type: string
            uuid: string
            props: Record<string, unknown>
        }>
    }

    if (rows.length > 0) {
        return {
            id: rows[0].id,
            type: rows[0].entity_type,
            uuid: rows[0].uuid,
            props: rows[0].props,
        }
    } else {
        return null
    }
}

export default getParent
