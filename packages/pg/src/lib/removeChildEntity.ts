import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

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
    tenantID = null,
}: {
    context: Context
    id: EntityID
    type: EntityType
    tenantID?: number
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    const nextSiblingID = await getNextSiblingID({
        context,
        type: type,
        id: id,
        _lock: true,
        tenantID,
    })

    const previousSiblingID = await getPreviousSiblingID({
        context,
        type: type,
        id: id,
        _lock: true,
        tenantID,
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
    }

    // Now remove the current entity from being a child
    await client.query(
        sql`
        UPDATE "`.append(table).append(sql`"
           SET parent = null, parent_type = null, previous = null
         WHERE tenant_id = ${tenantID}
           AND entity_type = ${type}
           AND id = ${id}
    `)
    )
}

export default removeChildEntity
