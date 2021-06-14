import { Context } from "@entity-core/context"
import getPreviousSiblingID from "./getPreviousSiblingID"
import getNextSiblingID from "./getNextSiblingID"
import getLastChildID from "./getLastChildID"
import getEntityParent from "./getEntityParent"

import {
    EntityID,
    EntityType,
    EntityPlacement,
    EntitySiblings,
} from "../interfaces"

async function getSiblings({
    context,
    childEntityID = null,
    childEntityType,
    placement = null,
    _lock = false,
    tenantID = null,
}: {
    context: Context
    childEntityID?: EntityID
    childEntityType: EntityType
    placement: EntityPlacement | null
    _lock: boolean
    tenantID?: number
}): Promise<EntitySiblings> {
    if (placement === null) {
        return {
            parentID: null,
            parentType: null,
            previousSiblingID: null,
            nextSiblingID: null,
        }
    }

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
            tenantID,
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
            tenantID,
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
                tenantID,
            })

            nextSiblingID = placement.entityID
        } else if (placement.type === `after`) {
            // We're going after it, so we need to look up the next sibling ID from the current
            // placement and use that. Then the placement becomes this entity's before.
            nextSiblingID = await getNextSiblingID({
                context,
                id: placement.entityID,
                type: placement.entityType,
                _lock,
                tenantID,
            })

            previousSiblingID = placement.entityID
        }
    }

    return {
        parentID,
        parentType,
        previousSiblingID,
        nextSiblingID,
    } as EntitySiblings
}

export default getSiblings
