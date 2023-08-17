#!/usr/bin/env node

import { runSuite, startAgent } from './index'
import { Command } from 'commander';
const program = new Command();


//ex: apic-cli run ".\example\ToDo demo.suit.apic" -e ".\example\APIC Todo demo-env.env.apic" -r cli,junit -d
//ex: apic-cli run ".\example\ToDo demo-with-env.suit.apic" -r cli,junit
program
    .command('run <suit>')
    .alias('r')
    .description('Run apic Test Suit or an entire Test Project')
    .usage('<suit> [options]')
    .option('-e, --environment <path>', 'Specify a URL or Path to an apic environment file.')
    .option('-r, --reporters <reporters>', 'Comma separated list of reporters to use (without any space)')
    .option('--reporters-junit-path <path>', 'Path to write the junit report file')
    .option('-d , --responseData', 'if specified, response data will be logged in the cli reporter')
    .option('-x , --proxy <proxy URL>', 'Proxy URL Eg: http://username:password@hostname:port')
    .action((suite, command) => {
        runSuite(suite, getRunOptions(command));
    });
    
    program.command('agent')
    .description('Start apic agent to make api requests while using apic with browser to avoid cross-origin resource sharing (CORS) limitation.')
    .usage(' [options]')
    .option('-p, --port <port>', 'Specify the port to start thge agent. Default:8008')
    .option('-x , --proxy <proxy URL>', 'Proxy URL Eg: http://username:password@hostname:port')
    .action((command) => {
        startAgent(command)
    });

program.on('--help', function () {
    console.info('\nTo view all available options for a command run:');
    console.info('  apic [command] -h');
    console.info('  eg: apic run -h');
    console.info('  eg: apic agent -h');
});

// Warn on invalid command and then exits.
program.on('command:*', (command) => {
    console.error(`error:  \`${command}\` is an invalid command \n`);
    program.help();
});

function getRunOptions(command) {
    var options = {};
    command && Object.keys(command).forEach((key) => {
        if (!key.startsWith('_') && ['commands', 'options', 'parent'].indexOf(key) < 0) {
            options[key] = command[key];
        }
    })
    return options;
}

program.parse(process.argv)
