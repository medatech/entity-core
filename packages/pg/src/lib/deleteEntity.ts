import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import { Entity, EntityID, EntityType } from "../interfaces"

import getChildren from "./getChildren"
import unrelateEntity from "./unrelateEntity"
import getParent from "./getParent"
import removeChildEntity from "./removeChildEntity"

async function _deleteEntity({
    context,
    id,
    type,
    isChild,
    tenantID,
}: {
    context: Context
    id: EntityID
    type: EntityType
    isChild: boolean
    tenantID?: TenantID
}): Promise<void> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const entityTable = dataSource.tablePrefix + `entity`
    const entityRelTable = dataSource.tablePrefix + `relationship`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    // We need to remove all the children entities first
    // Start by getting all the possible child entity_types in case there are
    // multiple children types
    const { rows: childRows } = await client.query<{ entity_type: string }>(
        sql`
        SELECT DISTINCT entity_type FROM "`
            .append(entityTable)
            .append(
                sql`"
         WHERE parent = ${id}
           AND parent_type = ${type}
           `
            )
            .append(
                tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``
            )
    )

    for (let i = 0; i < childRows.length; i += 1) {
        const childType = childRows[i].entity_type

        // Get all the children entities
        let fromID = null
        let children = null
        do {
            children = await getChildren<Entity>({
                context,
                parentID: id,
                parentType: type,
                childType,
                fromID,
                limit: 100,
                tenantID,
            })

            if (children.length > 0) {
                for (let j = 0; j < children.length; j += 1) {
                    // Delete the child entity
                    await _deleteEntity({
                        context,
                        id: children[j].id,
                        type: childType,
                        isChild: true,
                        tenantID,
                    })
                }

                fromID = children[children.length - 1].id // Continue from the last one on the next page
            }
        } while (children.length === 100)
    }

    // Find anything that relates to this entity, then remove it from the relationship
    const { rows: inboundRows } = await client.query<{
        name: string
        from_id: EntityID
        from_type: EntityType
    }>(
        sql`
        SELECT
            name,
            from_id,
            from_type
        FROM "`
            .append(entityRelTable)
            .append(
                sql`"
        WHERE to_id = ${id}
          AND to_type = ${type}
          `
            )
            .append(
                tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``
            )
    )

    for (let i = 0; i < inboundRows.length; i += 1) {
        const record = inboundRows[i]
        await unrelateEntity({
            context,
            relationship: record.name,
            sourceEntityID: record.from_id,
            sourceEntityType: record.from_type,
            targetEntityID: id,
            targetEntityType: type,
            tenantID,
        })
    }

    if (!isChild) {
        // We need to remove this entity from the parent so the siblings are kept in tact
        const parent = await getParent<Entity>({
            context,
            type,
            id,
            tenantID,
        })

        if (parent !== null) {
            await removeChildEntity({
                context,
                id: id,
                type: type,
                tenantID,
            })
        }
    }

    // Now remove the entity
    await client.query(
        sql`
        DELETE FROM "`
            .append(entityTable)
            .append(
                sql`"
         WHERE entity_type = ${type}
           AND id = ${id}
           `
            )
            .append(
                tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``
            )
    )
}

function deleteEntity({
    context,
    id,
    type,
    tenantID,
}: {
    context: Context
    id: EntityID
    type: EntityType
    tenantID?: TenantID
}): Promise<void> {
    return _deleteEntity({ context, id, type, isChild: false, tenantID })
}

export default deleteEntity
