import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { Entity, EntityRecord, EntityPlacement } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"
import getSiblings from "./getSiblings"

async function createEntity<E extends Entity>({
    context,
    entity,
    placement = null,
}: {
    context: Context
    entity: Entity
    placement?: EntityPlacement
}): Promise<E> {
    const dataSource = context.dataSource as PostgresDataSource
    const table = dataSource.tablePrefix + `entity`
    const client = (await context.getDB()) as PostgresClient

    const tenantID = context.getTenantID()
    const uuid = entity.uuid || context.uuid()

    // Work out the siblings based on the placement
    const siblings = await getSiblings({
        context,
        childEntityType: entity.type,
        placement,
        _lock: true,
    })

    const query = sql`
        INSERT INTO "`.append(table).append(sql`"
        (tenant_id, entity_type, uuid, props, parent, parent_type, previous)
        VALUES
        (${tenantID}, ${entity.type}, ${uuid}, ${entity.props || null}, ${
        siblings.parentID
    }, ${siblings.parentType}, ${siblings.previousSiblingID})
        RETURNING *
    `)

    const result = await client.query<EntityRecord>(query)
    if (result.rows.length !== 1) {
        throw new Error(
            `Unable to create entity, expected 1 result but received ${result.rows.length}`
        )
    }
    const record = result.rows[0]

    // Now if we have a new next sibling, point that to this entity we just created
    if (siblings.nextSiblingID !== null) {
        await client.query(
            sql`
                    UPDATE "`.append(table).append(sql`"
                    SET previous = ${record.id}
                    WHERE tenant_id = ${tenantID}
                    AND entity_type = ${record.entity_type}
                    AND id = ${siblings.nextSiblingID}
                `)
        )
    }

    const outputEntity = {
        id: record.id,
        type: record.entity_type,
        uuid: record.uuid,
        props: record.props,
    } as E

    return outputEntity
}

export default createEntity
