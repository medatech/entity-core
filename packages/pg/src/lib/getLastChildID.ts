import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { EntityID, EntityType } from "../interfaces"

async function getLastChildID({
    context,
    parentID,
    parentType,
    childEntityType,
    _lock = false,
}: {
    context: Context
    parentID: EntityID
    parentType: EntityType
    childEntityType: EntityType
    _lock: boolean
}): Promise<EntityID | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const tenantID = context.getTenantID()
    const table = dataSource.tablePrefix + `entity`

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = await client.query<{ id: EntityID }>(
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
    )

    if (rows.length > 0) {
        return rows[0].id
    }

    return null
}

export default getLastChildID
