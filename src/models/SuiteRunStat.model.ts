export interface SuiteRunStat {
    startTime: number,
    endTime: number,
    requestsTotal: number,
    requestsFail: number,
    testsTotal: number,
    testsFail: number,
    endResult: 'PASS' | 'FAIL'
}