const apicCli = require('../dist/');

// apicCli.run('.\\example\\ToDo demo.suit.apic', {
//apicCli.run('.\\example\\x-form.suit.apic', {
//apicCli.run('.\\example\\form-data.suit.apic', {
apicCli.run('https://apic.app/api/webAccess/APICSuite/123456abcdef-testsuite-demo?token=apic-demo-suite', {
    // environment: '.\\example\\APIC Todo demo-env.env.apic',
    reporters: 'cli,junit',
    responseData: true
});