import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { EntityID, EntityType } from "../interfaces"

async function getPreviousSiblingID({
    context,
    id,
    type,
    _lock = false,
    tenantID,
}: {
    context: Context
    id: EntityID
    type: EntityType
    _lock: boolean
    tenantID?: TenantID | null
}): Promise<EntityID | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = await client.query<{ previous: EntityID }>(
        sql`
        SELECT previous
          FROM "`
            .append(table)
            .append(
                sql`"
         WHERE entity_type = ${type}
           AND id = ${id}
           `
            )
            .append(
                tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``
            )
            .append(
                sql`
         LIMIT 1
         `
            )
            .append(optionalUpdate)
    )

    if (rows.length > 0) {
        return rows[0].previous
    } else {
        return null
    }
}

export default getPreviousSiblingID
