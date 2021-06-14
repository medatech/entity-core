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

interface System extends Entity {
    type: "System"
    props: null
}

describe(`createEntity`, () => {
    beforeAll(_beforeAll)
    afterAll(_afterAll)
    beforeEach(_beforeEach)

    it(`should allow me to get an entity by it's uuid`, async () => {
        // First create the document
        await createEntity<Document>({
            context,
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
        const doc = await getEntityByUuid<Document>({
            context,
            uuid: `test-uuid`,
            type: `Document`,
        })

        expect(doc).toMatchObject({
            id: `1`,
            type: `Document`,
            uuid: `test-uuid`,
            props: {
                title: `My Document`,
                shared: true,
            },
        })
    })

    it(`should allow me to get a system entity from a specific tenant`, async () => {
        await createEntity<Document>({
            context,
            entity: {
                type: `System`,
                uuid: `system`,
                props: null,
            },
            tenantID: `500`,
        })

        // Get the entity by uuid
        const system = await getEntityByUuid<Document>({
            context,
            uuid: `system`,
            type: `System`,
            tenantID: `500`,
        })

        expect(system).toEqual({
            id: `1`,
            type: `System`,
            uuid: `system`,
            props: null,
        })
    })
})
