// @ ts-nocheck
// speech input for Organic
export {OrganicSpeech};
var log = console.log, msgfix = console.log;

var SpeechRecognition;
// eslint-disable-next-line no-undef
SpeechRecognition = SpeechRecognition || window.webkitSpeechRecognition;

// var webkitSpeechGrammarList, SpeechGrammarList;
// SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

const OrganicSpeechF = function() {
    // grammar is ignored by Chrome, 09/10/2020. we use list as helper
    // test with grammar  https://mcmw.abilitynet.org.uk/chrome-os-chromebook-speech-re
    // var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + list.join(' ! ') + ';';
    // var speechRecognitionList = new SpeechGrammarList();
    // var len;
    // speechRecognitionList.addFromString(grammar, 1);
    let me = this;

    let recognition;

    function init() {
        recognition = new SpeechRecognition();
        // recognition.grammars = speechRecognitionList;
        recognition.maxAlternatives = 3;
        recognition.interimResults = true; // interim are interesting, but too difficult to use
                                        // it would help if words in results were time tagged so you could check duplicates etc???
                                        // BUT interim are useful to stop continuous movement as soon as possible
        recognition.continuous = false;
        recognition.onstart = () => {/*log('started');*/ st = 0;}
        recognition.onend = () => { /*log('restarting');*/ recognition.start(); }
        recognition.onerror = event => { if (event.error !== 'no-speech') log('recognition error', event.error); };
        var st = 0, newsoundt = 0;
        
        recognition.onresult = function(event) {
            const commands = OrganicSpeech.commands;
            // With continuous the final results accumulate; (almost?) always zero (just interim) or zero one extra result per call
            // Without they do not, and event.results.length is almost always 1
            // if (event.results.length !== len++) log('####################### ? length', len, event.results.length);
            let ll, dt;
            if (!st) {
                st = Date.now();
                // log('#########################################################');
                ll = [];
                dt = 0;
            } else {
                dt = Date.now() - st;
                ll = ['~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ' + dt]
            }
            let done = 0;
            for (const results of event.results) {
                if (results.isFinal && newsoundt) {
                    log('newsound to final', Date.now() - newsoundt);
                    newsoundt = 0;
                }
                // newsound gives a chance to interrupt some other continuous action
                // without waiting for any precise recognition
                if (!results.isFinal && !newsoundt) { 
                    if (OrganicSpeech.commands.newsound) OrganicSpeech.commands.newsound(); 
                    log('###newsound###');
                    newsoundt = Date.now();
                }
                if (!results.isFinal) break;
                let heard = [];
                for (const result of results) {
                    var rawtext = result.transcript;
                    heard.push(rawtext);
                    const ltext = rawtext.toLowerCase();
                    const words = ltext.split(' ').map(x => OrganicSpeech.replace[x] || x);
                    const reptext = words.join(' ');
                    if (reptext !== ltext) heard.push('? ' + reptext);
                    for (let i = 0; i < words.length; i++) {
                        for (let j = i+1; j <= words.length; j++) {
                            const cmd = words.slice(i,j).join(' ');
                            if (commands[cmd]) {
                                OrganicSpeech.commands[cmd]();
                                i = j-1;
                                heard.push('> ' + cmd);
                                done++;
                                break;
                            }
                        }
                    }
                    if (done) break;
                }
                if (results.isFinal) st = 0;
                if (heard.length) ll.push('heard: ' + heard.join(' | '));
                msgfix('heard', heard.join('<br>'));
            }
            if (ll.length > 2 || st === 0) log(dt, ll.join('\n')); // else log(dt, ',');
        }
    }

    me._running = false;

    me._start = function() {
        if (me._running) return;
        if (!recognition) init();
        recognition.start();
        me._running = true;
    }

    me._stop = function() {
        if (!me._running) return;
        recognition.onend = () => {};
        recognition.stop();
        recognition = undefined;
        me._running = false;
    }
    // return me;

    me.commands = {};
    me.replace = {};

}
const OrganicSpeech = new OrganicSpeechF();
Object.defineProperty(OrganicSpeech, 'isRunning', {
    get: () => OrganicSpeech._running,
    set: v => { v ? OrganicSpeech._start() : OrganicSpeech._stop() }
});
// OrganicSpeech()
//OrganicSpeech.commands = {};
//OrganicSpeech.replace = {};
