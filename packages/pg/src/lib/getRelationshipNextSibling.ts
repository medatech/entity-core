import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import {
    EntityID,
    EntityType,
    EntityRelationship,
    EntitySibling,
} from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"

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
    const client = await dataSource.getClient()
    const entityRelTable = dataSource.tablePrefix + `entity_relationship`

    const tenantID = context.getTenantID()

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
