# apic-cli
The command line utility to run you APIs tests with apic. apic-cli allows you to test your Test Suits created with apic from a command line or with a node js app. 
# How to use apic-cli
## For running tests
### In terminal
if you   want to use apic from the command line run

    npm install apic-cli -g

Once installed you can run `apic-cli -h` to view all available commands.

**Command:**

`apic run|r <suit> [options]`  Run apic Test Suit or an entire Test Project

**Options**

`-e, --environment <path>`  :   Specify a URL or Path to an apic environment file.

`-r, --reporters <reporters>` :  Comma separated list of reporters to use (without any space)

`-d , --responseData`  :  if specified, response data will be logged in the cli reporter

`-h, --help`  : output usage information

Example: `apic run ".\example\ToDo demo.suit.apic" -e ".\example\APIC Todo demo-env.env.apic" -r cli,junit -d`

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

## Starting the Web Agent
If you are using the web version of APIC, like every web application making web requests to other domains will be limited by CORS. You can get around thsi by using APIC's Web Agent which runs a local agent on your machine. This agent is used for forwarding all https calls. This allows the Web version of APIC to send the requets to the agent and read response from it via Web Sockets bypassing the CORS limitation.

To Learn more about the APIC Web Agent visit [https://docs.apic.app/apic-web-agent-apic-cli](https://docs.apic.app/apic-web-agent-apic-cli)

**Command:**

`apic agent [options]`  Start the APIC Web Agent

**Options**

`-p, --port <port numver>`  :   'Specify the port to start thge agent. Default:8008'

Once the agent is up and running you can connect to it from the Web application and forward all your requests.
# What is "apic"
APIC provides a complete end to end solution for APIs; staring from **design** to **documentation** to **testing.** With a simplistic UI for Designing APIs and a feature rich platform for testing them, APIC provides a common platform for your API architects, developers and testers. APIC also comes with an API simulator so your Front-end team can work in parallel to your Back-end team.

Here are some awesome features of apic

 - [API designer](https://apic.app/docs/designer.html)
 - [API Tester](https://apic.app/docs/tester.html)
 - [Test Builder](https://docs.apic.app/tester/using-test-builder)
 - [API docs](https://apic.app/docs/docs.html)
 - [API Simulator](https://apic.app/docs/simulator.html)
 - [Team Sharing](https://apic.app/docs/sharing.html)

Learn more about apic at [www.apic.app](www.apic.app)


