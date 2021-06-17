import { Context } from "@entity-core/context"
import {
    createEntity,
    registerTenant,
    getEntityByUuid,
    getChildren,
    findEntity,
} from "../src"
import { Entity } from "../src/interfaces"

import {
    dataSource,
    getClient,
    _beforeAll,
    _afterAll,
    _beforeEach,
} from "./common"

jest.mock(`nanoid`)

type Status = "todo" | "doing" | "done"

interface Task extends Entity {
    type: "Task"
    props: {
        task: string
        status: Status
    }
}

interface Account extends Entity {
    type: "Account"
    props: {
        email: string
    }
}

interface System extends Entity {
    type: "System"
    props: null
}

describe(`Todo App Test`, () => {
    beforeAll(_beforeAll)
    afterAll(_afterAll)
    beforeEach(async () => {
        await _beforeEach()
        await createScenarios()
    })

    async function getSystem(context: Context) {
        let system = await getEntityByUuid<System>({
            context,
            uuid: `system`,
            type: `System`,
            tenantID: `1`,
        })

        return system
    }

    async function createAccount(context: Context, email: string) {
        const system = await getSystem(context)
        // Assume the account is valid, we can create it
        const tenantID = await registerTenant({ context })
        context.setTenantID(tenantID)

        return await createEntity<Account>({
            context,
            entity: {
                type: `Account`,
                props: {
                    tenantID,
                    email,
                },
            },
            placement: {
                type: `child`,
                entityID: system.id,
                entityType: system.type,
            },
        })
    }

    async function createTask(
        context: Context,
        account: Account,
        task: string,
        status: Status
    ) {
        const taskEntity = await createEntity<Task>({
            context,
            entity: {
                type: `Task`,
                props: {
                    task,
                    status,
                },
            },
            placement: {
                type: `child`,
                entityID: account.id,
                entityType: account.type,
            },
        })
        return taskEntity
    }

    async function createUserScenario(email: string) {
        // Create user 1
        const context = new Context({ dataSource })
        const account = await createAccount(context, email)

        // Create some tasks
        await createTask(context, account, `Task 1`, `todo`)
        await createTask(context, account, `Task 2`, `doing`)
        await createTask(context, account, `Task 3`, `todo`)
    }

    async function createScenarios() {
        await createUserScenario(`user1@example.com`)
        await createUserScenario(`user2@example.com`)
    }

    it(`should allow accounts to be queried across tenants`, async () => {
        const context = new Context({ dataSource, tenantID: `1` })
        const system = await getSystem(context)
        const accounts = await getChildren<Account>({
            context,
            parentID: system.id,
            parentType: system.type,
            childType: `Account`,
            tenantID: null, // Any tenant
        })
        expect(accounts.length).toBe(2)
        expect(accounts[0].props.email).toBe(`user1@example.com`)
        expect(accounts[1].props.email).toBe(`user2@example.com`)

        await context.end()
    })

    it(`should allow an account to be looked up across tenants using it's email address`, async () => {
        const context = new Context({ dataSource, tenantID: `1` })
        const account = await findEntity<Account>({
            context,
            props: { email: `user2@example.com` },
            type: `Account`,
            tenantID: null,
        })
        expect(account.props.email).toBe(`user2@example.com`)

        await context.end()
    })

    it(`should allow me to get just the todo tasks for a given account`, async () => {
        const context = new Context({ dataSource, tenantID: `1` })
        const account = await findEntity<Account>({
            context,
            props: { email: `user2@example.com` },
            type: `Account`,
            tenantID: null, // Search all tenants
        })
        context.setTenantID(account.tenantID)
        // Now get all the todo tasks
        const tasks = await getChildren<Task>({
            context,
            parentID: account.id,
            parentType: account.type,
            childType: `Task`,
            filter: {
                status: `todo`,
            },
        })

        expect(tasks.length).toBe(2)
        expect(tasks[0].props.task).toBe(`Task 1`)
        expect(tasks[1].props.task).toBe(`Task 3`)
        expect(tasks[0].props.status).toBe(`todo`)
        expect(tasks[1].props.status).toBe(`todo`)

        await context.end()
    })
})
