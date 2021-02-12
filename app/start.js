const {spawn} = require('child_process');
const fetch = require('node-fetch');

let ready = false;
const keytoneProcess = spawn('yarn', ['start']);

keytoneProcess.stdout.setEncoding('utf8');
keytoneProcess.stderr.setEncoding('utf8');
keytoneProcess.stdout.on('data', console.log);
keytoneProcess.stderr.on('data', console.error);

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
            // console.info(`[KeystoneJS::Startup] result text: `, result.text());
            return result;
        })
        .catch(error => {
            // We can get back an error "Cannot parse JSON" when a HTML
            // response is returned, so we assume the server is ready
            if (error.type !== 'system') {
                console.info(`[KeystoneJS::Startup] error: `, error.type, error.code, error.message);
                onReady();
            }
        })
        .then(result => {
            // console.info(`[KeystoneJS::Startup] result: `, result);
            result && result.json()
                .then(({loading, status} = {}) => {
                    console.info(`[KeystoneJS::Startup] status: ${status}`);
                    if (!loading) {
                        onReady();
                    }
                })
                .catch(error => {
                    if (error.type === 'invalid-json') {
                        onReady();
                    } else {
                        console.info(`[KeystoneJS::Startup] error: `, error);
                    }
                });
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
