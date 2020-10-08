import { createEntity, getEntity } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"
import { Entity } from "../Types"

interface Document extends Entity {
    type: "Document"
    props: {
        title: string
        shared: boolean
    }
}

interface DocumentEntity extends Document {
    id: number
    uuid: string
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
        const doc = await createEntity<DocumentEntity>({
            context,
            entity: entitySpec,
        })

        const verifyDoc = await getEntity<DocumentEntity>({
            context,
            id: entity.id,
            type: entity.type,
        })

        expect(verifyDoc).toMatchObject({
            id: doc.id,
            type: entitySpec.type,
            uuid: doc.uuid,
            props: entitySpec.props,
        })

        await context.end()
    })

    it(`should allow me to get a null entity`, async () => {
        const context = new Context({
            dataSource,
        })

        const verifyEntity = await getEntity({
            context,
            id: `123`,
            type: `Document`,
        })
        expect(verifyEntity).toBe(null)

        await context.end()
    })
})
