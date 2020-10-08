import { createEntity, updateEntity, getEntity } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"

describe(`createEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to update an entity with new props`, async () => {
        const entitySpec = {
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
