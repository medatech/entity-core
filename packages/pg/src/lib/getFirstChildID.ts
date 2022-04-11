import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { EntityID, EntityType } from "../interfaces"

async function getFirstChildID({
    context,
    parentID,
    parentType,
    childEntityType,
    _lock = false,
    tenantID,
}: {
    context: Context
    parentID: EntityID
    parentType: EntityType
    childEntityType: EntityType
    _lock: boolean
    tenantID: TenantID | null
}): Promise<EntityID | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const table = dataSource.tablePrefix + `entity`

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = await client.query<{ id: EntityID }>(
        sql`
            SELECT e.id FROM "`
            .append(table)
            .append(
                sql`" e
                    WHERE 
                        e.entity_type = ${childEntityType}
                    AND e.parent = ${parentID}
                    AND e.parent_type = ${parentType}
                    AND e.previous is null
                    `
            )
            .append(
                tenantID !== null ? sql`AND e.tenant_id = ${tenantID}` : sql``
            )
            .append(
                sql`
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

export default getFirstChildID
