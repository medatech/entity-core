import { createEntity } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"

describe(`createEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to create an entity`, async () => {
        const entitySpec = {
            type: `Document`,
            props: {
                title: `My Document`,
                shared: true,
            },
        }

        const context = new Context<null>({
            dataSource,
            model: null,
        })

        // Now create the entity
        const entity = await createEntity({ context, entity: entitySpec })

        expect(entity).toMatchObject({
            id: entity.id,
            type: entitySpec.type,
            uuid: entity.uuid,
            props: entitySpec.props,
        })

        await context.end()
    })

    it(`should allow me to create an entity without a title or props`, async () => {
        const context = new Context({
            dataSource,
        })

        // Now create the entity
        const entity = await createEntity({
            context,
            entity: {
                type: `Thing`,
            },
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
