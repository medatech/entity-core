import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityID, EntityType } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function countChildren({
    context,
    parentID,
    childEntityType = null,
}: {
    context: Context
    parentID: EntityID
    childEntityType: EntityType
}): Promise<number> {
    if (childEntityType === null) {
        throw new Error(`Invalid child type of ${childEntityType}`)
    }

    const dataSource = context.dataSource as PostgresDataSource
    const table = dataSource.tablePrefix + `entity`
    const client = (await context.getDB()) as PostgresClient
    const tenantID = context.getTenantID()

    const query = sql`
        SELECT count(*) AS total
        FROM "`.append(table).append(sql`"
        WHERE tenant_id = ${tenantID}
        AND entity_type = ${childEntityType}
        AND parent = ${parentID}
    `)

    const { rows } = await client.query<{ total: number }>(query)

    return rows.length > 0 ? +rows[0].total : 0
}

export default countChildren
