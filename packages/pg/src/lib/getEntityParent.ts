import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { EntityID, EntityType, EntityParent } from "../interfaces"

async function getEntityParent({
    context,
    id,
    type,
}: {
    context: Context
    id: EntityID
    type: EntityType
}): Promise<EntityParent | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const tenantID = context.getTenantID()
    const table = dataSource.tablePrefix + `entity`

    const { rows } = await client.query<{
        parent: EntityID
        parent_type: EntityType
    }>(
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
    )

    if (rows.length > 0) {
        return {
            id: rows[0].parent,
            type: rows[0].parent_type,
        } as EntityParent
    }

    return null
}

export default getEntityParent
