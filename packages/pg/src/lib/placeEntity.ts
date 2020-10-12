import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import getPreviousSiblingID from "./getPreviousSiblingID"
import getNextSiblingID from "./getNextSiblingID"
import getLastChildID from "./getLastChildID"
import getEntityParent from "./getEntityParent"
import { EntityID, EntityType, EntityPlacement } from "../interfaces"

interface Siblings {
    parentID: EntityID
    parentType: EntityType
    previousSiblingID: EntityID | null
    nextSiblingID: EntityID | null
}

async function getSiblings({
    context,
    childEntityID,
    childEntityType,
    placement,
    _lock = false,
}: {
    context: Context
    childEntityID: EntityID
    childEntityType: EntityType
    placement: EntityPlacement
    _lock: boolean
}): Promise<Siblings> {
    // If we're placing a child, we want to reference the parent accordingly
    let parentID: EntityID
    let parentType: EntityType
    let previousSiblingID: EntityID | null = null
    let nextSiblingID: EntityID | null = null

    // If the placement is a child plament, then we want to put it at the end of the children list
    if (placement.type === `child`) {
        parentID = placement.entityID
        parentType = placement.entityType

        // Find the existing last entity in the list and now make this the previous sibling
        previousSiblingID = await getLastChildID({
            context,
            parentID,
            parentType,
            childEntityType,
            _lock,
        })

        // If the last child was the entity we're placing, then return no sibling
        if (previousSiblingID === childEntityID) {
            previousSiblingID = null
        }
    } else {
        // We're placing this before or after another, but we still need the parent details
        // so let's look this up from the sibling we're about to place this next to
        const parent = await getEntityParent({
            context,
            id: placement.entityID,
            type: placement.entityType,
        })

        if (parent === null) {
            throw new Error(`Unable to find sibling entity of matching type`)
        }

        parentID = parent.id
        parentType = parent.type

        // Now we know the parent, let's work out what to do depending on if it's going
        // before or after the placement entity
        if (placement.type === `before`) {
            // We're going before it, so we need to take the sibling from the placement
            // entity and use that, then this entity becomes the placement's before entity
            previousSiblingID = await getPreviousSiblingID({
                context,
                id: placement.entityID,
                type: placement.entityType,
                _lock,
            })

            nextSiblingID = placement.entityID
        } else if (placement.type === `after`) {
            // We're going after it, so we need to look up the next sibling ID from the current
            // placement and use that. Then the placement becomes this entitie's before.
            nextSiblingID = await getNextSiblingID({
                context,
                id: placement.entityID,
                type: placement.entityType,
                _lock,
            })

            previousSiblingID = placement.entityID
        }
    }

    return {
        parentID,
        parentType,
        previousSiblingID,
        nextSiblingID,
    } as Siblings
}

/**
 * This funtion helps us remove an existing child out of the chain by making it's immediately before/after neighbours become
 * direct neibhbours of themselves.
 */
async function detachChild({
    context,
    id,
    type,
}: {
    context: Context
    id: EntityID
    type: EntityType
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const tenantID = context.getTenantID()
    const table = dataSource.tablePrefix + `entity`

    // We need to close the existing gap, so first let's get the current previous and next
    const oldPreviousID = await getPreviousSiblingID({
        context,
        type,
        id,
        _lock: true,
    })

    const oldNextID = await getNextSiblingID({
        context,
        type,
        id,
        _lock: true,
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
        // There is no next entity, but if there is a previous one, set that to the last entity in the list
        if (oldPreviousID !== null) {
            await client.query(
                sql`
                    UPDATE "`.append(table).append(sql`"
                    SET is_last_child = true
                    WHERE tenant_id = ${tenantID}
                    AND entity_type = ${type}
                    AND id = ${oldPreviousID}
                `)
            )
        }

        // Remove parent references to the entity we just detached
        await client.query(
            sql`
                UPDATE "`.append(table).append(sql`"
                SET is_last_child = false, parent = null, parent_type = null
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
}: {
    context: Context
    id: EntityID
    type: EntityType
    siblings: Siblings
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

    // Update to the (possibly new -- but might be the same) parent and set the new previous ID
    await client.query(
        sql`
            UPDATE "`.append(table).append(sql`"
            SET parent = ${siblings.parentID},
                parent_type = ${siblings.parentType},
                previous = ${siblings.previousSiblingID},
                is_last_child = ${
                    siblings.nextSiblingID === null ? true : false
                }
            WHERE tenant_id = ${tenantID}
            AND entity_type = ${type}
            AND id = ${id}
        `)
    )

    if (
        siblings.nextSiblingID === null &&
        siblings.previousSiblingID !== null
    ) {
        // We are the new last entity, so update the previous one to be false is_last_child
        await client.query(
            sql`
                UPDATE "`.append(table).append(sql`"
                SET is_last_child = false
                WHERE tenant_id = ${tenantID}
                AND entity_type = ${type}
                AND id = ${siblings.previousSiblingID}
            `)
        )
    }

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
}: {
    context: Context
    id: EntityID
    type: EntityType
    placement: EntityPlacement
}): Promise<void> {
    // Work out the siblings based on the placement
    const siblings = await getSiblings({
        context,
        childEntityID: id,
        childEntityType: type,
        placement,
        _lock: true,
    })

    // Detach the entity from any previous child relationships
    await detachChild({ context, id, type })
    // Now attach the child back again to the new siblings
    await attachChild({ context, id, type, siblings })
}

export default placeEntity
