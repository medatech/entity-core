import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import {
    EntityID,
    EntityType,
    EntityRelationship,
    EntitySibling,
} from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function getRelationshipPreviousSibling({
    context,
    relationship,
    fromID,
    fromType,
    entityID,
    entityType,
    _lock = false,
    tenantID = null,
}: {
    context: Context
    relationship: EntityRelationship
    fromID: EntityID
    fromType: EntityType
    entityID: EntityID
    entityType: EntityType
    _lock: boolean
    tenantID?: number
}): Promise<EntitySibling | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const entityRelTable = dataSource.tablePrefix + `relationship`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = await client.query<{
        to_id: EntityID
        to_type: EntityType
    }>(
        sql`
        SELECT to_id, to_type
          FROM "`
            .append(entityRelTable)
            .append(
                sql`"
         WHERE tenant_id = ${tenantID}
           AND name = ${relationship}
           AND from_id = ${fromID}
           AND from_type = ${fromType}
           AND previous = ${entityID}
           AND previous_type = ${entityType}
         LIMIT 1
         `.append(optionalUpdate)
            )
    )

    if (rows.length > 0) {
        return {
            id: rows[0].to_id,
            type: rows[0].to_type,
        } as EntitySibling
    } else {
        return null
    }
}

export default getRelationshipPreviousSibling
