import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import getPreviousSiblingID from "./getPreviousSiblingID"
import getNextSiblingID from "./getNextSiblingID"
import getSiblings from "./getSiblings"
import getParents from "./getParents"
import {
    EntityID,
    EntityType,
    EntityPlacement,
    EntitySiblings,
} from "../interfaces"

/**
 * This funtion helps us remove an existing child out of the chain by making it's immediately before/after neighbours become
 * direct neibhbours of themselves.
 */
async function detachChild({
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

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    const table = dataSource.tablePrefix + `entity`

    // We need to close the existing gap, so first let's get the current previous and next
    const oldPreviousID = await getPreviousSiblingID({
        context,
        type,
        id,
        _lock: true,
        tenantID,
    })

    const oldNextID = await getNextSiblingID({
        context,
        type,
        id,
        _lock: true,
        tenantID,
    })

    if (oldNextID !== null) {
        // We need to close the gap over the old position
        await client.query(
            sql`
                UPDATE "`.append(table).append(sql`"
                SET previous = ${oldPreviousID}
                WHERE tenant_id = ${tenantID}
                AND entity_type = ${type}
                AND id = ${oldNextID}
            `)
        )
    } else {
        // Remove parent references to the entity we just detached
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
}

async function attachChild({
    context,
    id,
    type,
    siblings,
    tenantID,
}: {
    context: Context
    id: EntityID
    type: EntityType
    siblings: EntitySiblings
    tenantID?: number
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    // Update to the (possibly new -- but might be the same) parent and set the new previous ID
    await client.query(
        sql`
            UPDATE "`.append(table).append(sql`"
            SET parent = ${siblings.parentID},
                parent_type = ${siblings.parentType},
                previous = ${siblings.previousSiblingID}
            WHERE tenant_id = ${tenantID}
            AND entity_type = ${type}
            AND id = ${id}
        `)
    )

    // Now if we have a new next sibling, point that to this entity we just placed
    if (siblings.nextSiblingID !== null) {
        await client.query(
            sql`
                UPDATE "`.append(table).append(sql`"
                SET previous = ${id}
                WHERE tenant_id = ${tenantID}
                AND entity_type = ${type}
                AND id = ${siblings.nextSiblingID}
            `)
        )
    }
}

async function placeEntity({
    context,
    id,
    type,
    placement,
    tenantID = null,
}: {
    context: Context
    id: EntityID
    type: EntityType
    placement: EntityPlacement
    tenantID?: number
}): Promise<void> {
    if (id === placement.entityID) {
        throw new Error(
            `Entity cannot be placed as a child or sibling of itself`
        )
    }

    // Make sure the child isn't one of the parents
    const parents = await getParents({
        context,
        id: placement.entityID,
        type: placement.entityType,
        tenantID,
    })

    if (parents.findIndex((parent) => parent.id === id) !== -1) {
        throw new Error(`Child cannot also be a parent or grandparent`)
    }

    // Work out the siblings based on the placement
    const siblings = await getSiblings({
        context,
        childEntityID: id,
        childEntityType: type,
        placement,
        _lock: true,
        tenantID,
    })

    // Detach the entity from any previous child relationships
    await detachChild({ context, id, type, tenantID })
    // Now attach the child back again to the new siblings
    await attachChild({ context, id, type, siblings, tenantID })
}

export default placeEntity
