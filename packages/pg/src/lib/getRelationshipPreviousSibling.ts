import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import {
    EntityID,
    EntityType,
    EntityRelationship,
    EntitySibling,
} from "../interfaces"

async function getRelationshipPreviousSibling({
    context,
    relationship,
    fromID,
    fromType,
    entityID,
    entityType,
    _lock = false,
    tenantID,
}: {
    context: Context
    relationship: EntityRelationship
    fromID: EntityID
    fromType: EntityType
    entityID: EntityID
    entityType: EntityType
    _lock: boolean
    tenantID?: TenantID | null
}): Promise<EntitySibling | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const entityRelTable = dataSource.tablePrefix + `relationship`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const result = await client.query<{
        previous: EntityID
        previous_type: EntityType
    }>(
        sql`
        SELECT previous, previous_type
          FROM "`
            .append(entityRelTable)
            .append(
                sql`"
         WHERE
               name = ${relationship}
           AND from_id = ${fromID}
           AND from_type = ${fromType}
           AND to_id = ${entityID}
           AND to_type = ${entityType}
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

    if (result.rows.length > 0) {
        return {
            id: result.rows[0].previous,
            type: result.rows[0].previous_type,
        } as EntitySibling
    } else {
        return null
    }
}

export default getRelationshipPreviousSibling
