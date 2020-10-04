import { createEntity, getEntity } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"

describe(`getEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to get an entity`, async () => {
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

        // Now create the entity
        const entity = await createEntity({ context, entity: entitySpec })

        const verifyEntity = await getEntity({
            context,
            id: entity.id,
            type: entity.type,
        })

        expect(verifyEntity).toMatchObject({
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

        const verifyEntity = await getEntity({
            context,
            id: `123`,
            type: `Document`,
        })
        expect(verifyEntity).toBe(null)

        await context.end()
    })
})
