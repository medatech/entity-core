import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import { EntityID, EntityType } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function countChildren({
    context,
    parentID,
    childEntityType = null,
    tenantID,
}: {
    context: Context
    parentID: EntityID
    childEntityType: EntityType
    tenantID?: TenantID | null
}): Promise<number> {
    if (childEntityType === null) {
        throw new Error(`Invalid child type of ${childEntityType}`)
    }

    const dataSource = context.dataSource as PostgresDataSource
    const table = dataSource.tablePrefix + `entity`
    const client = (await context.getDB()) as PostgresClient
    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const query = sql`
        SELECT count(*) AS total
        FROM "`
        .append(table)
        .append(
            sql`"
        WHERE entity_type = ${childEntityType}
        AND parent = ${parentID}
        `
        )
        .append(tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``)

    const { rows } = await client.query<{ total: number }>(query)

    return rows.length > 0 ? +rows[0].total : 0
}

export default countChildren
