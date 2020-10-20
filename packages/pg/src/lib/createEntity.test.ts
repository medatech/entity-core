import { createEntity, getChildren } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../fixtures"
import { Entity } from "../interfaces"

interface Document extends Entity {
    type: "Document"
    props: {
        title: string
        shared: boolean
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

    it.only(`should create an entity as a child of a paent entity`, async () => {
        const context = new Context({
            dataSource,
        })

        const doc = await createEntity<Document>({
            context,
            entity: {
                type: `Document`,
                props: {
                    title: `Doc`,
                },
            },
        })

        // Now create the pages
        const page2 = await createEntity<Page>({
            context,
            entity: {
                type: `Page`,
                props: {
                    number: 2,
                },
            },
            placement: {
                type: `child`,
                entityID: doc.id,
                entityType: doc.type,
            },
        })

        const page1 = await createEntity<Page>({
            context,
            entity: {
                type: `Page`,
                props: {
                    number: 1,
                },
            },
            placement: {
                type: `before`,
                entityID: page2.id,
                entityType: page2.type,
            },
        })

        await createEntity<Page>({
            context,
            entity: {
                type: `Page`,
                props: {
                    number: 3,
                },
            },
            placement: {
                type: `after`,
                entityID: page2.id,
                entityType: page2.type,
            },
        })

        await createEntity<Page>({
            context,
            entity: {
                type: `Page`,
                props: {
                    number: 4,
                },
            },
            placement: {
                type: `child`,
                entityID: doc.id,
                entityType: doc.type,
            },
        })

        const pages = await getChildren<Page>({
            context,
            parentID: doc.id,
            parentType: doc.type,
            childType: `Page`,
        })

        expect(pages.map((page) => page.props.number)).toEqual([1, 2, 3, 4])

        await context.end()
    })
})
