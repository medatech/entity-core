import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"

import getNextSiblingID from "./getNextSiblingID"
import getPreviousSiblingID from "./getPreviousSiblingID"

import { EntityID, EntityType } from "../interfaces"

/**
 * Remove this entity from being a child to the parent
 */
async function removeChildEntity({
    context,
    id,
    type,
}: {
    context: Context
    id: EntityID
    type: EntityType
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`
    const tenantID = context.getTenantID()

    const nextSiblingID = await getNextSiblingID({
        context,
        type: type,
        id: id,
        _lock: true,
    })

    const previousSiblingID = await getPreviousSiblingID({
        context,
        type: type,
        id: id,
        _lock: true,
    })

    if (nextSiblingID !== null) {
        // There is a next sibling, so update it to be the previous sibling
        await client.query(
            sql`
            UPDATE "`.append(table).append(sql`"
               SET previous = ${previousSiblingID}
             WHERE tenant_id = ${tenantID}
               AND entity_type = ${type}
               AND id = ${nextSiblingID}
        `)
        )
    } else {
        // There is no next sibling, so update the previous to be the last child if it exists
        if (previousSiblingID !== null) {
            await client.query(
                sql`
                UPDATE "`.append(table).append(sql`"
                   SET is_last_child = true
                 WHERE tenant_id = ${tenantID}
                   AND entity_type = ${type}
                   AND id = ${previousSiblingID}
            `)
            )
        }
    }

    // Now remove the current entity from being a child
    await client.query(sql`
        UPDATE entity
           SET parent = null, parent_type = null, is_last_child = false
         WHERE tenant_id = ${tenantID}
           AND entity_type = ${type}
           AND id = ${id}
    `)
}

export default removeChildEntity
