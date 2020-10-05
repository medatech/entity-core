import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType, EntityQuery } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function countChildren({
    context,
    parentID,
    childEntityType = null,
}: {
    context: Context
    parentID: string
    childEntityType: string
}): Promise<number> {
    if (childEntityType === null) {
        throw new Error(`Invalid child type of ${childEntityType}`)
    }

    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`
    const tenantID = context.getTenantID()

    const query = sql`
        SELECT count(*) AS total
        FROM "`.append(table).append(sql`"
        WHERE tenant_id = ${tenantID}
        AND entity_type = ${childEntityType}
        AND parent = ${parentID}
    `)

    const { rows } = (await client.query(query)) as {
        rows: { total: number }[]
    }

    return rows.length > 0 ? rows[0].total : 0
}

export default countChildren
