import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { EntityID, EntityType, EntityParent } from "../interfaces"

async function getEntityParent({
    context,
    id,
    type,
    tenantID,
}: {
    context: Context
    id: EntityID
    type: EntityType
    tenantID?: TenantID | null
}): Promise<EntityParent | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

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
            WHERE 
                entity_type = ${type}
            AND id = ${id}
            `
            )
            .append(
                tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``
            ).append(sql`
            LIMIT 1
        `)
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
