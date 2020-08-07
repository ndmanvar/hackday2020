document.getElementById("test").addEventListener('click', () => {
    function getScripts() {
        return Array.from(document.getElementsByTagName("script")).map(h => h.outerHTML);
    }

    function getWindowSentry() {
        return localStorage.hasSentry;
    }

    let hasSentry = false;

    chrome.tabs.executeScript({
        code: '(' + getWindowSentry + ')();' //argument here is a string but function.toString() returns function's code
    }, (results) => {
        if (!!results[0] && results[0] === "true") {
            hasSentry = true;
        } else {
            chrome.tabs.query({
                    active: true,
                    currentWindow: true
                }, (tabs) => {
                    let url = tabs[0].url;

                    chrome.tabs.executeScript({
                        code: '(' + getScripts + ')();' //argument here is a string but function.toString() returns function's code
                    }, (results) => {
                        if (results.length > 0 && results[0].length > 0) {
                            let i = 0;
                            while (i < results[0].length && !hasSentry) {
                                const scriptString = results[0][i];
                                if (scriptString.includes('src=') && !scriptString.includes('src="chrome-extension://')) {
                                    let srcRegEx = /src="(.*?)"/g,
                                        source = srcRegEx.exec(scriptString),
                                        scriptSrc = source[1];

                                    if (!scriptSrc.includes('http')) {
                                        scriptSrc = url.slice(0, -1) + scriptSrc;
                                    }
                                    fetch(scriptSrc).then(response => response.text()).then(text => {
                                        if (text.includes('dsn:')) { // to figure out if using sentry.io or on-prem/rev-proxy, as well as Raven
                                            hasSentry = true;
                                            alert('has Sentry via NPM/YARN');
                                        }
                                    }).catch( error =>  {
                                        alert(error);
                                        console.log(error);
                                    });
                                } else if (scriptString.toLowerCase().includes('dsn:')) {
                                    hasSentry = true;
                                    alert('has Sentry via NPM/YARN');
                                }

                                i++;
                            }

                        } else {
                            console.log("Did not find any script tags");
                        }
                    });
                }
            );
        }
        if (hasSentry) {
            alert('has Sentry via CDN');
        }
    });
});

// TODO solve for etsy: where they have it on the window.Sentry (i think its cause they are using loader)
