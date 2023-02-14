import falcon
import falcon.asgi


class Ping:
    async def on_get(self, _, resp):
        resp.status = falcon.HTTP_200
        resp.content_type = falcon.MEDIA_TEXT
        resp.text = "Hello, World!"


app = falcon.asgi.App()

ping = Ping()

app.add_route('/ping', ping)