import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import { EntityUuid, EntityType, Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function getEntityByUuid<E extends Entity>({
    context,
    uuid,
    type,
    _lock = false,
    tenantID,
}: {
    context: Context
    uuid: EntityUuid
    type: EntityType
    _lock?: boolean
    tenantID?: TenantID | null
}): Promise<E | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const query = sql`
        SELECT * FROM "`
        .append(table)
        .append(
            sql`"
        WHERE 
               entity_type = ${type}
          AND uuid = ${uuid}
          `
        )
        .append(tenantID !== null ? sql`AND tenant_id = ${tenantID}` : sql``)
        .append(sql`
        LIMIT 1
    `)

    if (_lock) {
        query.append(`FOR UPDATE`)
    }

    const result = await client.query<EntityRecord>(query)
    if (result.rows.length === 0) {
        return null
    }
    const record = result.rows[0]

    const outputEntity = {
        id: record.id,
        type: record.entity_type,
        uuid: record.uuid,
        props: record.props,
        tenantID: record.tenant_id,
    } as E

    return outputEntity
}

export default getEntityByUuid
