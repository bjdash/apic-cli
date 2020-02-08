const apicCli = require('../lib');

// apicCli.run('.\\example\\ToDo demo.suit.apic', {
//apicCli.run('.\\example\\x-form.suit.apic', {
//apicCli.run('.\\example\\form-data.suit.apic', {
apicCli.run('.\\example\\ToDo demo-with-env.suit.apic', {
    // environment: '.\\example\\APIC Todo demo-env.env.apic',
    reporters: 'cli,junit',
    responseData: true
});