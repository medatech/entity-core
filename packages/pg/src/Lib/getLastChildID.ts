import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"

async function getLastChildID({
    context,
    parentID,
    parentType,
    childEntityType,
    _lock = false,
}: {
    context: Context
    parentID: string
    parentType: string
    childEntityType: string
    _lock: boolean
}): Promise<string | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const tenantID = context.getTenantID()
    const table = dataSource.tablePrefix + `entity`

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = (await client.query(
        sql`
            SELECT id FROM "`
            .append(table)
            .append(
                sql`"
                    WHERE tenant_id = ${tenantID}
                    AND entity_type = ${childEntityType}
                    AND parent = ${parentID}
                    AND parent_type = ${parentType}
                    AND is_last_child = true
                    LIMIT 1
                `
            )
            .append(optionalUpdate)
    )) as { rows: Array<{ id: string }> }

    if (rows.length > 0) {
        return rows[0].id
    }

    return null
}

export default getLastChildID
