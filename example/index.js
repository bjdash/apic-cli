const apicCli = require('../lib');

apicCli.run('.\\example\\ToDo demo.suit.apic', {
    environment: '.\\example\\APIC Todo demo-env.env.apic',
    reporters: 'cli,junit',
    responseData: true
});