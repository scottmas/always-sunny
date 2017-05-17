# Always Sunny

There are some scenarios, like testing webhooks, where you simply want a server that always immediately returns a 200.

Thanks to infrastructure on demand services like [Zeit](https://zeit.co) (which this project uses), this is now ridiculously easy,
 whether you want to use the publicly available server or create your own private one.

## Quick Start (Public)

Simply send ANY request (GET, POST, PUT, etc) with any set of headers or body to
```
https://always-sunny-ouqtksgoik.now.sh
```

If you want to see the most recent 10 requests made by anyone (including other users), simply append `/recent` like so:
```
GET https://always-sunny-ouqtksgoik.now.sh/recent
```
or for JSON representation of the 10 most recent:
```
GET https://always-sunny-ouqtksgoik.now.sh/recent.json
```

## Quick Start (Private)
If you want your own instance of this server, simply run the following:

```bash
git clone https://github.com/Finicity/always-sunny.git && cd always-sunny
npm install
npm deploy
```

You will be automatically prompted for your Zeit credentials, which if you do not have you will need to gain by creating
 an account on their [website](https://zeit.co/login). Once done, simply paste the generated url to your browser.

Once your site is running, remember if you navigate to the special path `GET https://MY-WEBSITE-URL.now.sh/recent` or
`GET https://MY-WEBSITE-URL.now.sh/recent.json` you will be able to see values for the past 10 requests.

## Blacklist
Don't send your testing requests to `GET /recent` or `GET /recent.json` since these endpoints are needed to show the most recent requests.
Also, requests to `GET /favicon.ico` will be ignored.