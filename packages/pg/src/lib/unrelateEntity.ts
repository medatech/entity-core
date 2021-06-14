import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

import getRelationshipPreviousSibling from "./getRelationshipPreviousSibling"
import getRelationshipNextSibling from "./getRelationshipNextSibling"

import { EntityID, EntityType, EntityRelationship } from "../interfaces"

async function unrelateEntity({
    context,
    relationship,
    sourceEntityID,
    sourceEntityType,
    targetEntityID,
    targetEntityType,
    tenantID = null,
}: {
    context: Context
    relationship: EntityRelationship
    sourceEntityID: EntityID
    sourceEntityType: EntityType
    targetEntityID: EntityID
    targetEntityType: EntityType
    tenantID?: number
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const entityRelTable = dataSource.tablePrefix + `relationship`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    // We need to close the existing gap, so first let's get the current previous and next
    const oldPrevious = await getRelationshipPreviousSibling({
        context,
        relationship,
        fromID: sourceEntityID,
        fromType: sourceEntityType,
        entityType: targetEntityType,
        entityID: targetEntityID,
        _lock: true,
        tenantID,
    })

    const oldNext = await getRelationshipNextSibling({
        context,
        relationship,
        fromID: sourceEntityID,
        fromType: sourceEntityType,
        entityID: targetEntityID,
        entityType: targetEntityType,
        _lock: true,
        tenantID,
    })

    if (oldNext !== null) {
        // There is a next sibling in our old position, so we need to close the gap
        await client.query(
            sql`
            UPDATE "`.append(entityRelTable).append(sql`"
               SET previous = ${oldPrevious ? oldPrevious.id : null},
                   previous_type = ${oldPrevious ? oldPrevious.type : null}
             WHERE tenant_id = ${tenantID}
               AND name = ${relationship}
               AND from_id = ${sourceEntityID}
               AND from_type = ${sourceEntityType}
               AND to_id = ${oldNext.id}
               AND to_type = ${oldNext.type}
        `)
        )
    }

    // Now remove this entity from the relationship before we insert it again
    await client.query(
        sql`
        DELETE
          FROM "`.append(entityRelTable).append(sql`"
         WHERE tenant_id = ${tenantID}
           AND name = ${relationship}
           AND from_id = ${sourceEntityID}
           AND from_type = ${sourceEntityType}
           AND to_id = ${targetEntityID}
           AND to_type = ${targetEntityType}
    `)
    )
}

export default unrelateEntity
