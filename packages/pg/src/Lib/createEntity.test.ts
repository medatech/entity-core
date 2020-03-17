import { createEntity } from "."

import { Context } from '@entity-core/context'
import { nanoid } from '@entity-core/uuid'
import { MockClient, MockDataSource } from '@entity-core/mock'
import { EntityQuery } from "../Types"
import { client, dataSource } from '../Fixtures/TestClient'

describe("createEntity", () => {
    it("should allow me to create an entity", async () => {

        const entitySpec = {
            type: `Document`,
            title: 'My Document',
            props: {
                shared: true
            }
        }

        // Mock the uuid assigned to the entity
        let uuid = null
        function mockUuid(): string {
            uuid = nanoid()
            return uuid;
        }

        // This is when the db queries are called, so mock the response from the db
        function mockQueries(query: string, variables?: Array<unknown>): EntityQuery {
            return {
                rows: [{
                    id: 100,
                    ['entity_type']: entitySpec.type,
                    uuid: variables[2] as string, // uuid
                    title: entitySpec.title,
                    props: entitySpec.props
                }]
            }
        }

        // Create our mock client, context and data source
        // const client = new MockClient()
        client.on('query', mockQueries)
        const context = new Context({
            dataSource,
            uuidGenerator: mockUuid
        })

        // Now create the entity
        const entity = await createEntity(context, entitySpec)

        expect(entity).toMatchObject({
            _id: `100`,
            type: entitySpec.type,
            uuid: uuid,
            title: entitySpec.title,
            props: entitySpec.props
        })
    })

    it("should allow me to create an entity without a title or props", async () => {

        const entitySpec = {
            type: `Thing`,
        }

        // Mock the uuid assigned to the entity
        function mockUuid(): string {
            return 'mock-uuid'
        }

        // This is when the db queries are called, so mock the response from the db
        function mockQueries(query: string, variables?: Array<unknown>): EntityQuery {
            return {
                rows: [{
                    id: 100,
                    ['entity_type']: entitySpec.type,
                    uuid: variables[2] as string, // uuid
                    title: null,
                    props: null
                }]
            }
        }

        // Create our mock client, context and data source
        const client = new MockClient()
        client.on('query', mockQueries)
        const context = new Context({
            dataSource: new MockDataSource(client),
            uuidGenerator: mockUuid
        })

        // Now create the entity
        const entity = await createEntity(context, entitySpec)

        expect(entity).toMatchObject({
            _id: `100`,
            type: entitySpec.type,
            uuid: 'mock-uuid',
            title: null,
            props: null
        })
    })

    it("should throw an error if the database didn't create an entity", async () => {

        const entitySpec = {
            type: `Thing`,
        }

        // Mock the uuid assigned to the entity
        function mockUuid(): string {
            return 'mock-uuid'
        }

        // Simulate the database not returning anything
        function mockQueries(): EntityQuery {
            return {
                rows: []
            }
        }

        // Create our mock client, context and data source
        const client = new MockClient()
        client.on('query', mockQueries)
        const context = new Context({
            dataSource: new MockDataSource(client),
            uuidGenerator: mockUuid
        })

        // Now create the entity
        expect(createEntity(context, entitySpec)).rejects.toEqual(new Error('No row returned from the database'))
    })
})