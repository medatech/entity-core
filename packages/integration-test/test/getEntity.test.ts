import { createEntity, getEntity, Entity } from "@entity-core/pg"

import { Context } from "@entity-core/context"
import {
    beforeEachTest,
    afterAllTests,
    dataSource,
} from "./fixtures"

interface Document extends Entity {
    type: "Document"
    props: {
        title: string
        shared: boolean
    }
}

describe(`getEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to get an entity`, async () => {
        const entitySpec: Document = {
            type: `Document`,
            props: {
                title: `My Document`,
                shared: true,
            },
        }

        const context = new Context({
            dataSource,
        })

        // Now create the entity
        const entity = await createEntity<Document>({
            context,
            entity: entitySpec,
        })

        const verifyDoc = await getEntity<Document>({
            context,
            id: entity.id,
            type: entity.type,
        })

        expect(verifyDoc).toMatchObject({
            id: entity.id,
            type: entitySpec.type,
            uuid: entity.uuid,
            props: entitySpec.props,
        })

        await context.end()
    })

    it(`should allow me to get a null entity`, async () => {
        const context = new Context({
            dataSource,
        })

        const verifyEntity = await getEntity<Document>({
            context,
            id: 123,
            type: `Document`,
        })
        expect(verifyEntity).toBe(null)

        await context.end()
    })
})
