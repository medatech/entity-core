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
    tenantID = null,
}: {
    context: Context
    parentID: EntityID
    parentType: EntityType
    childEntityType: EntityType
    _lock: boolean
    tenantID?: number
}): Promise<EntityID | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient

    if (tenantID === null) {
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
                    WHERE e.tenant_id = ${tenantID}
                    AND e. entity_type = ${childEntityType}
                    AND e. parent = ${parentID}
                    AND e. parent_type = ${parentType}
                    -- AND there is no next row referencing this (so it's the last)
                    AND NOT EXISTS (
                        SELECT
                        FROM "`
                    .append(table)
                    .append(
                        sql`" n
                        WHERE n.tenant_id = ${tenantID}
                        AND n.entity_type = ${childEntityType}
                        AND n.parent = ${parentID}
                        AND n.parent_type = ${parentType}
                        AND n.previous = e.id
                        LIMIT 1
                      )
                    LIMIT 1
                `
                    )
            )
            .append(optionalUpdate)
    )

    if (rows.length > 0) {
        return rows[0].id
    }

    return null
}

export default getLastChildID
