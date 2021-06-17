import { createEntity, getEntityByUuid } from "."
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

interface Thing extends Entity {
    type: "Thing"
    props: null
}

describe(`createEntity`, () => {
    beforeAll(_beforeAll)
    afterAll(_afterAll)
    beforeEach(_beforeEach)

    it(`should allow me to get an entity by it's uuid`, async () => {
        // First create the document
        const doc = await createEntity<Document>({
            context: context.current,
            entity: {
                type: `Document`,
                uuid: `test-uuid`,
                props: {
                    title: `My Document`,
                    shared: true,
                },
            },
        })

        // Get the entity by uuid
        const verifyDoc = await getEntityByUuid<Document>({
            context: context.current,
            uuid: `test-uuid`,
            type: `Document`,
        })

        expect(verifyDoc).toMatchObject({
            id: doc.id,
            type: `Document`,
            uuid: `test-uuid`,
            props: {
                title: `My Document`,
                shared: true,
            },
        })
    })

    it(`should allow me to get an entity from a specific tenant`, async () => {
        const thing = await createEntity<Thing>({
            context: context.current,
            entity: {
                type: `Thing`,
                uuid: `thing`,
                props: null,
            },
            tenantID: `500`,
        })

        // Get the entity by uuid
        const verifyThing = await getEntityByUuid<Thing>({
            context: context.current,
            uuid: `thing`,
            type: `Thing`,
            tenantID: `500`,
        })

        expect(verifyThing).toEqual({
            id: thing.id,
            type: `Thing`,
            uuid: `thing`,
            props: null,
        })
    })
})
