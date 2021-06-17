import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import { EntityID, EntityType, Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function getParent<E extends Entity>({
    context,
    id,
    type,
    tenantID,
}: {
    context: Context
    id: EntityID
    type: EntityType
    // TODO: Allow parents to go accross tenants?
    tenantID?: TenantID | null
}): Promise<E | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const query = sql`
        SELECT p.*
        FROM "`
        .append(table)
        .append(
            sql`" p, "`
                .append(table)
                .append(
                    sql`" c
        WHERE p.id = c.parent
        `
                )
                .append(
                    tenantID !== null
                        ? sql`
        AND p.tenant_id = ${tenantID}
        AND c.tenant_id = ${tenantID}
        `
                        : sql``
                ).append(sql`
        AND c.entity_type = ${type}
        AND c.id = ${id}
        LIMIT 1
        `)
        )

    const { rows } = await client.query<EntityRecord>(query)

    if (rows.length > 0) {
        return {
            id: rows[0].id,
            type: rows[0].entity_type,
            uuid: rows[0].uuid,
            props: rows[0].props,
            tenantID: rows[0].tenant_id,
        } as E
    } else {
        return null
    }
}

export default getParent
