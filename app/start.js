const {spawn, spawnSync} = require('child_process');
const fetch = require('node-fetch');

const keytoneProcess = spawn('yarn', ['start']);
keytoneProcess.stdout.setEncoding('utf8');
keytoneProcess.stderr.setEncoding('utf8');
keytoneProcess.stdout.on('data', console.log);
keytoneProcess.stderr.on('data', console.error);
const sleep = spawnSync('sleep', [1.5]);
let ready = false;

function onReady() {
    if (ready) {
        return;
    }
    ready = true;
    console.info(`[KeystoneJS::Startup] onReady`);

    const proxyProcess = spawn('node', ['proxy.js', '&']);

    proxyProcess.stdout.setEncoding('utf8');
    proxyProcess.stderr.setEncoding('utf8');
    proxyProcess.stdout.on('data', console.log);
    proxyProcess.stderr.on('data', console.error);
}

function checkAndSetStatus() {
    let cancelled = false;

    fetch('http://localhost:3000/', {headers: {Accept: 'application/json'}})
        .then(result => {
            return result.json();
        })
        .catch(error => {
            // We can get back an error "Cannot parse JSON" when a HTML
            // response is returned, so we assume the server is ready
            onReady();
        })
        .then(({loading, status} = {}) => {
            if (!loading) {
                onReady();
                return;
            }
            if (cancelled) {
                return;
            }
            console.info(`[KeystoneJS::Startup] ${status}`);
        });
    return () => {
        cancelled = true;
    };
}

let cancelLastCall = checkAndSetStatus();

const interval = setInterval(() => {
    cancelLastCall();
    if (ready) {
        clearInterval(interval);
        return;
    }
    cancelLastCall = checkAndSetStatus();
}, 500);
