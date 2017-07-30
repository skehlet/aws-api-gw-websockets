# Testing websockets and AWS API Gateway

Everything says you can't do this, but I wanted to test.

```bash
docker run \
	-it --rm \
	--name my-running-script \
	-v "$PWD":/usr/src/app \
	-w /usr/src/app \
	-p 3000:3000 \
	node:latest \
	node chat-server.js

```

- Set up your security group to allow inbound TCP port 3000.
- Hit `http://<your-public-ec2-dns-name>:3000/frontend.html` in your browser

The above verifies the app is working. 

I tried a bunch of things in API Gateway, but could never get this to work.
