import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"

async function getPreviousSiblingID({
    context,
    id,
    type,
    _lock = false,
}: {
    context: Context
    id: string
    type: string
    _lock: boolean
}): Promise<string> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`
    const tenantID = context.getTenantID()

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = (await client.query(
        sql`
        SELECT previous
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
            .append(optionalUpdate)
    )) as { rows: Array<{ previous: string }> }

    if (rows.length > 0) {
        return rows[0].previous
    } else {
        return null
    }
}

export default getPreviousSiblingID
