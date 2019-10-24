# apic-cli
The command line utility to run you APIs tests with apic. apic-cli allows you to test your Test Suits created with apic from a command line or with a node js app. 
## How to use apic-cli
### In terminal
if you   want to use apic from the command line run

    npm install apic-cli -g

Once installed you can run `apic-cli -h` to view all available commands.
**Command:**
`run|r [options] \<suit\>`  Run apic Test Suit or an entire Test Project
**Options**
`-e, --environment \<path\>`  :   Specify a URL or Path to an apic environment file.
  `-r, --reporters \<reporters\>` :  Comma separated list of reporters to use (without any space)
  `-d , --responseData`  :  if specified, response data will be logged in the cli reporter
  `-h, --help`  : output usage information

Example: `apic-cli run ".\example\ToDo demo.suit.apic" -e ".\example\APIC Todo demo-env.env.apic" -r cli,junit -d`

### With node js
If you want to use it with a node js application add it to your project by running

    npm install apic-cli --save
Next add below code to your script file.

    const apicCli = require('../lib');
   
    apicCli.run('.\\example\\ToDo demo.suit.apic', {
	    environment: '.\\example\\APIC Todo demo-env.env.apic',
	    reporters: 'cli,junit',
	    responseData: true
    });

Look in the examples folder for a sample node js app to run your Test Suit with apic. 
# What is "apic"
APIC provides a complete end to end solution for APIs; staring from **design** to **documentation** to **testing.** With a simplistic UI for Designing APIs and a feature rich platform for testing them, APIC provides a common platform for your API architects, developers and testers. APIC also comes with an API simulator so your Front-end team can work in parallel to your Back-end team.

Here are some awesome features of apic

 - [API designer](https://apic.app/docs/designer.html)
 - [API Tester](https://apic.app/docs/tester.html)
 - Test Builder
 - [API docs](https://apic.app/docs/docs.html)
 - [API Simulator](https://apic.app/docs/simulator.html)
 - [Team Sharing](https://apic.app/docs/sharing.html)

Learn more about apic at [www.apic.app](www.apic.app)


