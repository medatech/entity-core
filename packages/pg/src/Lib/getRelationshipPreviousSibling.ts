import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType } from "@entity-core/model"
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
    relationship: string
    fromID: string
    fromType: string
    entityID: string
    entityType: string
    _lock: boolean
}): Promise<EntityType | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const entityRelTable = dataSource.tablePrefix + `entity_relationship`

    const tenantID = context.getTenantID()

    const optionalUpdate = _lock ? `FOR UPDATE` : ``

    const { rows } = (await client.query(
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
    )) as { rows: Array<{ previous: string; previous_type: string }> }

    if (rows.length > 0) {
        return {
            id: rows[0].previous,
            type: rows[0].previous_type,
        }
    } else {
        return null
    }
}

export default getRelationshipPreviousSibling
