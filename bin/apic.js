#!/usr/bin/env node

const apic = require('../');
const commander = require('commander');
const program = new commander.Command();

program.version('0.0.1');

//ex: apic-cli run ".\example\ToDo demo.suit.apic" -e ".\example\APIC Todo demo-env.env.apic" -r cli,junit
program
    .command('run <suit>')
    .alias('r')
    .description('Run apic Test Suit or an entire Test Project')
    .usage('<suit> [options]')
    .option('-e, --environment <path>', 'Specify a URL or Path to an apic environment file.')
    .option('-r, --reporters <reporters>', 'Comma separated list of reporters to use (without any space)')
    .option('-d , --responseData', 'if specified, response data will be logged in the cli reporter')
    .action((suit, command) => {
        apic.run(suit, getRunOptions(command));
    });


program.on('--help', function () {
    console.info('\nTo view all available options for a command run:');
    console.info('  apic [command] -h');
});

program.on('command:*', (command) => {
    console.error(`error:  \`${command}\` is an invalid command \n`);
    program.help();
});

function getRunOptions(command){
    var options = {};
    command && Object.keys(command).forEach((key)=>{
        if(!key.startsWith('_') && ['commands', 'options', 'parent'].indexOf(key)<0){
            options[key] = command[key];
        }
    })
    return options;
}

program.parse(process.argv)

