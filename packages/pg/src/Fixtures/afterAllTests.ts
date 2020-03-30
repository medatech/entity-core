import dataSource from "./dataSource"
async function afterAllTests(): Promise<void> {
    await dataSource.disconnect();
}

export default afterAllTests