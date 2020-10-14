import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
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
}: {
    context: Context
    relationship: EntityRelationship
    fromID: EntityID
    fromType: EntityType
    entityID: EntityID
    entityType: EntityType
    _lock: boolean
}): Promise<EntitySibling | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const entityRelTable = dataSource.tablePrefix + `relationship`

    const tenantID = context.getTenantID()

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
         WHERE tenant_id = ${tenantID}
           AND name = ${relationship}
           AND from_id = ${fromID}
           AND from_type = ${fromType}
           AND to_id = ${entityID}
           AND to_type = ${entityType}
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
