import { createEntity, getChildren } from "."
import PostgresDataSource from "../PostgresDataSource"

import { Context } from "@entity-core/context"
import { Entity } from "../interfaces"
import { SQLStatement } from "sql-template-strings"

import { __resetNanoid } from "../../__mocks__/nanoid"
import { __poolClient } from "../../__mocks__/pg"

const dataSource = new PostgresDataSource({
    poolConfig: {
        database: `entitycore`,
        user: `entitycore`,
        password: `entitycore`,
        host: `localhost`,
    },
    tablePrefix: `ec_`,
})

jest.mock(`pg`)
jest.mock(`nanoid`)

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
    let context = new Context({
        dataSource,
    })

    beforeEach(() => {
        __resetNanoid()
    })

    it(`should allow me to create an entity`, async () => {
        const entitySpec: Document = {
            type: `Document`,
            props: {
                title: `My Document`,
                shared: true,
            },
        }

        jest.spyOn(__poolClient, `query`).mockImplementationOnce(
            async (query: SQLStatement) => {
                return {
                    rows: [
                        {
                            id: 100,
                            entity_type: query.values[1],
                            uuid: query.values[2],
                            props: query.values[3],
                        },
                    ],
                }
            }
        )

        // Now create the entity
        const doc = await createEntity<Document>({
            context,
            entity: entitySpec,
        })

        expect(doc).toMatchObject({
            id: 100,
            type: entitySpec.type,
            uuid: `uuid:1`,
            props: entitySpec.props,
        })
    })
})
