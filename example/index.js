const apicCli = require('../lib');

// apicCli.run('.\\example\\ToDo demo-with-env.suit.apic', {
//apicCli.run('.\\example\\x-form.suit.apic', {
//apicCli.run('.\\example\\form-data.suit.apic', {
apicCli.run('http://localhost:8080/api/webAccess/APICSuite/123456abcdef-testsuite-demo?token=123456abcdef-testsuite-demo', {
    // environment: '.\\example\\APIC Todo demo-env.env.apic',
    reporters: 'cli,junit',
    responseData: true
});