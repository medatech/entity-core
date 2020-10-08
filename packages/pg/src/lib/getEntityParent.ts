import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"

async function getEntityParent({
    context,
    id,
    type,
}: {
    context: Context
    id: string
    type: string
}): Promise<{ id: string; type: string } | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const tenantID = context.getTenantID()
    const table = dataSource.tablePrefix + `entity`

    const { rows } = (await client.query(
        sql`
            SELECT parent, parent_type
            FROM "`
            .append(table)
            .append(
                sql`"
            WHERE tenant_id = ${tenantID}
            AND entity_type = ${type}
            AND id = ${id}
            LIMIT 1
        `
            )
    )) as { rows: Array<{ parent: string; parent_type: string }> }

    if (rows.length > 0) {
        return {
            id: rows[0].parent,
            type: rows[0].parent_type,
        }
    }

    return null
}

export default getEntityParent
