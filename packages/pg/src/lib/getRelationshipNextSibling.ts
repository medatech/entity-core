import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
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
         WHERE name = ${relationship}
           AND from_id = ${fromID}
           AND from_type = ${fromType}
           AND previous = ${entityID}
           AND previous_type = ${entityType}
           `
            )
            .append(
                tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``
            )
            .append(
                sql`
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
