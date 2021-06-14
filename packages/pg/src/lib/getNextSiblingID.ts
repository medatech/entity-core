import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { EntityID, EntityType } from "../interfaces"

async function getNextSiblingID({
    context,
    id,
    type,
    _lock = false,
    tenantID = null,
}: {
    context: Context
    id: EntityID
    type: EntityType
    _lock: boolean
    tenantID?: number
}): Promise<EntityID> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = await client.query<{ id: EntityID }>(
        sql`
        SELECT id
          FROM "`
            .append(table)
            .append(
                sql`"
         WHERE tenant_id = ${tenantID}
           AND entity_type = ${type}
           AND previous = ${id}
         LIMIT 1
         `
            )
            .append(optionalUpdate)
    )

    if (rows.length > 0) {
        return rows[0].id
    } else {
        return null
    }
}

export default getNextSiblingID
