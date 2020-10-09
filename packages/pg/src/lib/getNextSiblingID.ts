import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import { EntityID, EntityType } from "../interfaces"

async function getNextSiblingID({
    context,
    id,
    type,
    _lock = false,
}: {
    context: Context
    id: EntityID
    type: EntityType
    _lock: boolean
}): Promise<EntityID> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`
    const tenantID = context.getTenantID()

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
