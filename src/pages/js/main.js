const nullthrows = (v) => {
    if (v == null) throw new Error("it's a null");
    return v;
}

function injectCode(src) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = async function() {
        console.log("Loaded Scripts!");
        this.remove();
        await main()
    };

    nullthrows(document.head || document.documentElement).appendChild(script);
}

injectCode(chrome.runtime.getURL('pages/js/thirdparty/jquery-3.6.3.min.js'));

function getDomain(url) {
    // Create a new anchor element
    var a = document.createElement('a');
    // Set the href of the anchor to the input URL
    a.href = url;
    // Use the anchor's properties to extract the protocol, domain, and subdomain
    let data = {
        protocol: a.protocol,
        hostname: a.hostname,
        domain: a.hostname,
        subdomain: a.hostname.split('.').slice(0, -2).join('.')
    };
    if(data.subdomain) {
        data['domain'] = a.hostname.replace(`${data.subdomain}.`, '')
    }

    return data
}

async function main() {

    $('#get-dns-current').click(async function() {
        const tab = (await chrome.tabs.query({ active: true }))[0]
        console.log(tab)
        let domain = getDomain(tab.url)
        console.log(domain)

        if(domain.protocol == 'chrome:') {
            return $('.main').html(
                `
                    <div class='error'>
                        <h2>🚫 Doesn't Work on Chrome Pages</h2>
                    </div>
                `
            )
        }

        let target = domain.domain

        await updateDNSPage(target)

    })

    $('#get-dns').click(async function() {

        $('.main').html(
            `
                <div class="center">
                    <form class="dns-input">
                        <input type="text" id="get-domain" name="domain">
                    </form>
                    <button id="submit-dns">Find Records</button>
                    <div class="info">
                        <p>Make sure to only type the domain name. Ex: "google.com". Without the "www." or any other subdomain.</p>
                    </div>
                </div>
            `
        )

        $('#submit-dns').click(async function() {
            let target = $('#get-domain').val()
            if(!target) return
            console.log(target)
            await updateDNSPage(target)
        })
    })

    $('#get-ip').click(async function() {

        const tab = (await chrome.tabs.query({ active: true }))[0]
        console.log(tab)
        let domain = getDomain(tab.url)

        if(domain.protocol == 'chrome:') {
            return $('.main').html(
                `
                    <div class='error'>
                        <h2>🚫 Doesn't Work on Chrome Pages</h2>
                    </div>
                    <div class="option back-full" id="back">
                        <p style="color: lightcoral">👈 Back<p>
                    </div>
                `
            ).click(() => {
                window.location.reload(true)
            })
        }

        domain = domain.hostname
        let data = await fetch(`http://ip-api.com/json/${domain}`)
        let json = await data.json()

        console.log(json)

        if(!json.status) {
            $('.main').html(
                `
                    <div class='error'>
                        <h2>🚫 Error resolving domain.</h2>
                    </div>
                    <div class="option back-full" id="back">
                        <p style="color: lightcoral">👈 Back<p>
                    </div>
                `
            )
        } else {

            $('.main').html(
                `
                    <div class="center">
                        <h2>${domain}</h2>
                    <div>
                    <div class="domain-info">
                        <p id="ip-info">IP Address: </p><p id="ip-value">${json.query}</p>
                        <p id="ip-info">Country: </p><p id="ip-value">${json.country}</p>
                        <p id="ip-info">ISP: </p><p id="ip-value">${json.isp}</p>


                    </div>
                    <div class="option back-full" id="back">
                        <p style="color: lightcoral">👈 Back<p>
                    </div>
                `
            )

        }

        $('#back').click(() => {
            window.location.reload(true)
        })


    })

    $('#get-history').click(async function() {

        let history = (await chrome.storage.local.get(['history'])).history
        if(!history) {
            $('.main').html(
                `
                    <div class='error'>
                        <h2>🚫 No history found.</h2>
                    </div>
                    <div class="option back-full" id="back">
                        <p style="color: lightcoral">👈 Back<p>
                    </div>
                `
            )
        } else {

            let domains = Object.keys(history)
            $('.main').html(
                `
                    <h2 style="text-align: center; color: var(--text)">🕐 History</h2>
                    ${domains.map(e => {
                        return `
                            <div class="option" id="history-${e}">
                                <p>${e}</p>
                            </div>
                        `
                    }).join('\n')}
                    <div class="history-menu">
                        <div class="option back" id="back">
                            <p style="color: lightcoral">👈 Back<p>
                        </div>
                        <div class="option" id="history-clear">
                            <p style="color: lightcoral">🧹 Clear History<p>
                        </div>
                    <div>
                `
            )
            domains.forEach(e => {
                document.getElementById(`history-${e}`).addEventListener("click", showHistory);
            })
            $('#history-clear').click(async function() {

                await chrome.storage.local.clear()
                $('.main').html(
                    `
                        <div class='error'>
                            <h2>🔏 History Cleared.</h2>
                        </div>
                        <div class="option back-full" id="back">
                            <p style="color: lightcoral">👈 Back<p>
                        </div>

                    `
                )
                $('#back').click(() => {
                    window.location.reload(true)
                })

            })

        }

        $('#back').click(() => {
            window.location.reload(true)
        })

    })

    

}

function mergeJSONObjects(obj1, obj2) {
    return Object.assign({}, obj1, obj2);
}

async function updateDNSPage(target) {
    $('.main').html(`
        <div class="infinity-3"></div>
        <div class="loading"><h2>⏳ Please wait..</h2></div>`)

        let data = await fetch(`https://htarget.deta.dev/dns?query=${target}`)
        let records = await data.text()

        console.log(records)

        if(records == 'error invalid host') {
            return $('.main').html(
                `
                    <div class='error'>
                        <h2>🚫 Invalid Hostname</h2>
                    </div>
                `
            )
        } else if(records == '') {
            return $('.main').html(
                `
                <div class='error'>
                    <h2>😢 No Records Found</h2>
                </div>
                `
            )
        } else {

            records = records.split('\n').filter(function(n){return n; });

            let history = {}
            history[`${target}`] = records

            let old_history = (await chrome.storage.local.get(['history'])).history
            if(!old_history) old_history = {}

            history = mergeJSONObjects(old_history, history)

            await chrome.storage.local.set({
                history
            })

            return $('.main').html(
                `
                    <div class="title"> <p>✅ Subdomains Found ${records.length}</p> </div>
                    ${records.map(e => {
                        let r = e.split(',')
                        return `
                            <div  class="record">
                                <p id="domain">${r[0]}</p>
                                <p id="ip">${r[1] ? r[1] : ''}</p>
                            </div>
                        `
                    }).join('\n')}
                `
            )

        }
}

async function showHistory() {

    let target = $(this)[0].id;
    let domain = target.replace('history-', '');
    let history = (await chrome.storage.local.get(['history'])).history
    let records = history[domain]
    console.log(records)

    return $('.main').html(
        `
            <div class="title"> <p>✅ Subdomains Found ${records.length}</p> </div>
            ${records.map(e => {
                let r = e.split(',')
                return `
                    <div  class="record">
                        <p id="domain">${r[0]}</p>
                        <p id="ip">${r[1] ? r[1] : ''}</p>
                    </div>
                `
            }).join('\n')}
        `
    )


}