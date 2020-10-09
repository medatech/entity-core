import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"

async function createEntity<E extends Entity>({
    context,
    entity,
}: {
    context: Context
    entity: Entity
}): Promise<E> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()
    const uuid = entity.uuid || context.uuid()

    const query = sql`
        INSERT INTO "`.append(table).append(sql`"
        (tenant_id, entity_type, uuid, props, parent, parent_type, previous)
        VALUES
        (${tenantID}, ${entity.type}, ${uuid}, ${
        entity.props || null
    }, null, null, null)
        RETURNING *
    `)

    const result = await client.query<EntityRecord>(query)
    if (result.rows.length !== 1) {
        throw new Error(
            `Unable to create entity, expected 1 result but received ${result.rows.length}`
        )
    }
    const record = result.rows[0]

    const outputEntity = {
        id: record.id,
        type: record.entity_type,
        uuid: record.uuid,
        props: record.props,
    } as E

    return outputEntity
}

export default createEntity
