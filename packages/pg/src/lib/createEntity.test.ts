import sql from "sql-template-strings"

import { createEntity } from "."
import { EntityRecord } from "../interfaces"
import { Entity } from "../interfaces"

import {
    context,
    getClient,
    _beforeAll,
    _afterAll,
    _beforeEach,
} from "../../test/common"

jest.mock(`nanoid`)

interface Document extends Entity {
    type: "Document"
    props: {
        title: string
        shared: boolean
    }
}
interface Page extends Entity {
    type: "Page"
    props: {
        number: number
    }
}

interface Thing extends Entity {
    type: "Thing"
}

describe(`createEntity`, () => {
    beforeAll(_beforeAll)
    afterAll(_afterAll)
    beforeEach(_beforeEach)

    it(`should allow me to create an entity`, async () => {
        const entitySpec: Document = {
            type: `Document`,
            props: {
                title: `My Document`,
                shared: true,
            },
        }

        // Now create the entity
        const doc = await createEntity<Document>({
            context: context.current,
            entity: entitySpec,
        })

        expect(doc).toMatchObject({
            id: doc.id,
            type: entitySpec.type,
            uuid: `uuid:1`,
            props: entitySpec.props,
        })
    })

    it(`should allow me to create an entity in a specific tenant`, async () => {
        const entitySpec: Document = {
            type: `Document`,
            uuid: `globalDocument`,
            props: {
                title: `My Document`,
                shared: true,
            },
        }

        const system = await createEntity<Document>({
            context: context.current,
            entity: entitySpec,
            tenantID: `500`,
        })

        expect(system.uuid).toBe(`globalDocument`)

        // Verify the tenant ID was 500
        const client = await getClient()
        const result = await client.query<EntityRecord>(
            sql`select * from ec_entity where uuid = 'globalDocument'`
        )

        expect(result.rows[0].tenant_id).toBe(`500`)
    })
})
