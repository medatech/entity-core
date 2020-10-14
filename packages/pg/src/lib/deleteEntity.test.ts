import { createEntity, getEntity, deleteEntity } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"
import { Entity, EntityID } from "../interfaces"

interface Document extends Entity {
    type: "Document"
    props: {
        title: string
        shared: boolean
    }
}

interface Node extends Entity {
    type: "Node"
    props: {
        name: string
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

describe(`deleteEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to delete an entity`, async () => {
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

        // Now delete the document
        await deleteEntity({ context, id: doc.id, type: doc.type })

        const verifyDoc = await getEntity<Document>({
            context,
            id: doc.id,
            type: doc.type,
        })

        expect(verifyDoc).toBe(null)

        await context.end()
    })

    it(`should allow me to delete an entity when it has children`, async () => {
        const context = new Context({
            dataSource,
        })

        function createNode(name: string, parent?: Node) {
            return createEntity<Node>({
                context,
                entity: { type: `Node`, props: { name } },
                placement:
                    (parent && {
                        type: `child`,
                        entityID: parent.id,
                        entityType: parent.type,
                    }) ||
                    null,
            })
        }

        function getNode(id: EntityID) {
            return getEntity<Node>({ context, id, type: `Node` })
        }

        const root = await createNode(`root`)
        const c1 = await createNode(`c1`, root)
        const c2 = await createNode(`c2`, root)
        const c1a = await createNode(`c1a`, c1)
        const c1b = await createNode(`c1b`, c1)
        const c1b1 = await createNode(`c1b1`, c1b)

        // Now delete c1 and verify what's left
        await deleteEntity({ context, id: c1.id, type: c1.type })

        await expect(getNode(root.id)).resolves.toEqual(root)
        await expect(getNode(c1.id)).resolves.toBe(null)
        await expect(getNode(c2.id)).resolves.toEqual(c2)
        await expect(getNode(c1a.id)).resolves.toBe(null)
        await expect(getNode(c1b.id)).resolves.toBe(null)
        await expect(getNode(c1b1.id)).resolves.toBe(null)

        await context.end()
    })

    it.todo(`should error if we are deleting an entity that doesn't exist`)

    it.todo(`should remove an entity in a relationship when it is deleted`)
})
