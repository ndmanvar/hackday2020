document.getElementById("test").addEventListener('click', () => {
    console.log("Popup DOM fully loaded and parsed");
        // alert('abc')

    function getScripts() {
        console.log('Tab script:');
        console.log(document.body);
        return Array.from(document.getElementsByTagName("script")).map(h => h.outerHTML);
    }

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
            let url = tabs[0].url;
            let hasSentry = false;

            chrome.tabs.executeScript({
                code: '(' + getScripts + ')();' //argument here is a string but function.toString() returns function's code
            }, (results) => {
                // alert(JSON.stringify(results));
                if (results.length > 0 && results[0].length > 0) {
                    for (const scriptString of results[0]) {
                        if (scriptString.includes('src=')) {
                            let srcRegEx = /src="(.*?)"/g,
                                source = srcRegEx.exec(scriptString),
                                scriptSrc = source[1];

                            if (!scriptSrc.includes('http')) {
                                scriptSrc = url.slice(0, -1) + scriptSrc;
                            }
                            fetch(scriptSrc).then(response => response.text()).then(text => {
                                if (text.includes('dsn:')) { // to figure out if using sentry.io or on-prem/rev-proxy
                                    alert('yeahh buddy we got sentry in hereee');
                                    hasSentry = true;
                                }
                            });
                        } else if (scriptString.toLowerCase().includes('sentry')) {
                            alert('we also got sentry in the house');
                            // var hasSentry = true;
                        }

                    }
                } else {
                    console.log("Did not find any script tags");
                }
            });
        }

    );

});


// TODO solve for etsy: where they have it on the window.Sentry (i think its cause they are using loader)
