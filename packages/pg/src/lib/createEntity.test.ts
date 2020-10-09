import { createEntity } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"
import { Entity } from "../interfaces"

interface Document extends Entity {
    type: "Document"
    props: {
        title: string
        shared: boolean
    }
}

interface Thing extends Entity {
    type: "Thing"
}

describe(`createEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to create an entity`, async () => {
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
        const doc = await createEntity<Document>({
            context,
            entity: entitySpec,
        })

        expect(doc).toMatchObject({
            id: doc.id,
            type: entitySpec.type,
            uuid: doc.uuid,
            props: entitySpec.props,
        })

        await context.end()
    })

    it(`should allow me to create an entity without a title or props`, async () => {
        const context = new Context({
            dataSource,
        })

        const thing: Thing = {
            type: `Thing`,
            props: null,
        }

        // Now create the entity
        const entity = await createEntity<Thing>({
            context,
            entity: thing,
        })

        expect(entity).toMatchObject({
            id: entity.id,
            type: `Thing`,
            uuid: entity.uuid,
            props: null,
        })

        await context.end()
    })
})
