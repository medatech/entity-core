import { createEntity, Entity } from "@entity-core/pg"
import {
    beforeEachTest,
    afterAllTests,
    dataSource,
} from "./fixtures"
import { Context } from "@entity-core/context"

interface User extends Entity {
    type: "User"
    props: {
        username: string
        email: string
        password?: string
    }
}

interface Team extends Entity {
    type: "Team"
    props: {
        name: string
    }
}

interface Group extends Entity {
    type: "Group"
    props: {
        name: string
        permission: "owner" | "member" | "viewer"
    }
}

interface TeamMember extends Entity {
    type: "TeamMember"
    props: {
        userID: number
        joined: number
    }
}

describe(`multiTenant`, () => {
    beforeEach(beforeEachTest)
    afterEach(afterAllTests)

    it(`should allow me to create a user in the global tenant and be a member of a team in another`, async () => {
        const globalContext = new Context({
            dataSource,
        })

        const tenantContext = new Context({
            dataSource,
            tenantID: 50,
        })

        const user = await createEntity<User>({
            context: globalContext,
            entity: {
                type: `User`,
                props: {
                    username: `user1`,
                    email: `user1@example.com`,
                    password: `password123`,
                },
            },
        })

        // Now create a team in the tenant space
        const team = await createEntity<Team>({
            context: tenantContext,
            entity: {
                type: `Team`,
                props: {
                    name: `Entity Team`,
                },
            },
        })

        // Create the owner's group
        const group = await createEntity<Group>({
            context: tenantContext,
            entity: {
                type: `Group`,
                props: {
                    name: `Owners`,
                    permission: `owner`,
                },
            },
            placement: {
                type: `child`,
                entityID: team.id,
                entityType: team.type,
            },
        })

        // Create a member in the owner's group
        const member = await createEntity<TeamMember>({
            context: tenantContext,
            entity: {
                type: `TeamMember`,
                props: {
                    userID: user.id,
                    joined: new Date().getTime(),
                },
            },
            placement: {
                type: `child`,
                entityID: group.id,
                entityType: group.type,
            },
        })

        expect(member.props.userID).toBe(user.id)
    })
})
