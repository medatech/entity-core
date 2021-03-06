import { createEntity, updateEntity, getEntity, Entity } from "@entity-core/pg"

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

describe(`updateEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to update an entity with new props`, async () => {
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

        // First create the entity
        const entity = await createEntity<Document>({
            context,
            entity: {
                type: `Document`,
                props: {
                    title: `My Document`,
                    shared: true,
                },
            },
        })

        // Now update it
        await updateEntity({
            context,
            entity: {
                id: entity.id,
                type: entity.type,
                props: {
                    title: `My New Document`,
                    shared: false,
                    comment: `A comment`,
                },
            },
        })

        // Get the entity
        const verifyEntity = await getEntity({
            context,
            id: entity.id,
            type: entity.type,
        })

        expect(verifyEntity).toMatchObject({
            id: entity.id,
            type: entitySpec.type,
            uuid: entity.uuid,
            props: {
                title: `My New Document`,
                shared: false,
                comment: `A comment`,
            },
        })

        await context.end()
    })

    it(`should allow me to update an entity with null props`, async () => {
        const context = new Context({
            dataSource,
        })

        // First create the entity
        const entity = await createEntity({
            context,
            entity: {
                type: `Document`,
                props: {
                    title: `My Document`,
                    shared: true,
                },
            },
        })

        // Now update it
        await updateEntity({
            context,
            entity: {
                id: entity.id,
                type: entity.type,
                props: null,
            },
        })

        // Get the entity
        const verifyEntity = await getEntity({
            context,
            id: entity.id,
            type: entity.type,
        })

        expect(verifyEntity).toMatchObject({
            id: entity.id,
            type: `Document`,
            uuid: entity.uuid,
            props: null,
        })

        await context.end()
    })
})
