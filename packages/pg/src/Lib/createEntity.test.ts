import { createEntity } from "."

import { Context } from '@entity-core/context'
import { nanoid } from '@entity-core/uuid'
import { EntityQuery } from "../Types"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"

describe("createEntity", () => {

    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it("should allow me to create an entity", async () => {
        const client = await dataSource.getClient();

        const entitySpec = {
            type: `Document`,
            props: {
                title: 'My Document',
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
            _id: entity._id,
            type: entitySpec.type,
            uuid: uuid,
            props: entitySpec.props
        })

        await client.release();
    })

    it("should allow me to create an entity without a title or props", async () => {
        const client = await dataSource.getClient();

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
                    props: null
                }]
            }
        }

        // Create our mock client, context and data source
        client.on('query', mockQueries)
        const context = new Context({
            dataSource,
            uuidGenerator: mockUuid
        })

        // Now create the entity
        const entity = await createEntity(context, entitySpec)

        expect(entity).toMatchObject({
            _id: entity._id,
            type: entitySpec.type,
            uuid: 'mock-uuid',
            props: null
        })
    })

    // it("should throw an error if the database didn't create an entity", async () => {
    //     const client = await dataSource.getClient();

    //     const entitySpec = {
    //         type: `Thing`,
    //     }

    //     // Mock the uuid assigned to the entity
    //     function mockUuid(): string {
    //         return 'mock-uuid'
    //     }

    //     // Simulate the database not returning anything
    //     function mockQueries(): EntityQuery {
    //         return {
    //             rows: []
    //         }
    //     }

    //     // Create our mock client, context and data source
    //     client.on('query', mockQueries)
    //     const context = new Context({
    //         dataSource,
    //         uuidGenerator: mockUuid
    //     })

    //     // Now create the entity
    //     expect(createEntity(context, entitySpec)).rejects.toEqual(new Error('No row returned from the database'))
    // })
})